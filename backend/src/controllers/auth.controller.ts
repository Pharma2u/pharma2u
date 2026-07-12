// Handles account registration, login, password changes, and admin provisioning.
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createAuthToken } from "../utils/jwt";
import { generateTempPassword } from "../utils/generateTempPassword";
import {
  validateChangePassword,
  validateLogin,
  validateProvisionAdmin,
  validateProvisionStaff,
  validateRegister,
} from "../validators/auth.validator";

const bcryptRounds = 12;
const dummyHash =
  "$2b$12$DpcQ4sFjggWnE26lYDhHJuyDxlMZC0gZh5yBtUcBFCz0pGwMm6tTe";
const publicUser = {
  id: true,
  role: true,
  name: true,
  phone: true,
  mustChangePassword: true,
} as const;

function duplicate(response: Response): void {
  response
    .status(409)
    .json({ message: "An account with these details already exists." });
}


async function phoneAvailable(phone: string): Promise<boolean> {
  return !(await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  }));
}

export async function register(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateRegister(request.body);
  if (!(await phoneAvailable(input.phone))) {
    duplicate(response);
    return;
  }
  const passwordHash = await bcrypt.hash(input.password, bcryptRounds);
  const user = await prisma.user.create({
    data: {
      ...input,
      role: "customer",
      passwordHash,
      mustChangePassword: false,
    },
    select: publicUser,
  });
  response
    .status(201)
    .json({
      token: createAuthToken(user.id, user.role),
      role: user.role,
      name: user.name,
      mustChangePassword: false,
    });
}



export async function login(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateLogin(request.body);
  const user = await prisma.user.findUnique({ where: { phone: input.phone } });
  // Keep both failures on the same bcrypt timing path to avoid phone-account enumeration.
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? dummyHash,
  );
  if (!user || !passwordMatches) {
    response.status(401).json({ message: "Invalid phone or password." });
    return;
  }
  response.json({
    token: createAuthToken(user.id, user.role),
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  });
}



export async function changePassword(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateChangePassword(request.body);
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: { passwordHash: true },
  });
  if (
    !user ||
    !(await bcrypt.compare(input.currentPassword, user.passwordHash))
  ) {
    response.status(400).json({ message: "currentPassword is incorrect." });
    return;
  }
  if (input.currentPassword === input.newPassword) {
    response
      .status(400)
      .json({ message: "newPassword must differ from currentPassword." });
    return;
  }
  await prisma.user.update({
    where: { id: request.user!.id },
    data: {
      passwordHash: await bcrypt.hash(input.newPassword, bcryptRounds),
      mustChangePassword: false,
    },
  });
  response.json({ message: "Password changed successfully." });
}

export async function me(request: Request, response: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: publicUser,
  });
  if (!user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }
  response.json(user);
}



export async function provisionStaff(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateProvisionStaff(request.body);
  if (!(await phoneAvailable(input.phone))) {
    duplicate(response);
    return;
  }
  const temporaryPassword = generateTempPassword();
  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      name: input.name,
      role: input.role,
      passwordHash: await bcrypt.hash(temporaryPassword, bcryptRounds),
      mustChangePassword: true,
    },
    select: { id: true, phone: true, role: true },
  });
  // The plaintext credential is deliberately returned only here and never persisted separately.
  response.status(201).json({ ...user, temporaryPassword });
}


export async function provisionAdmin(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateProvisionAdmin(request.body);
  if (!(await phoneAvailable(input.phone))) {
    duplicate(response);
    return;
  }
  const actingAdmin = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: { passwordHash: true },
  });
  // A stolen admin JWT alone must not be enough to create another privileged account.
  if (
    !actingAdmin ||
    !(await bcrypt.compare(input.currentPassword, actingAdmin.passwordHash))
  ) {
    response.status(400).json({ message: "currentPassword is incorrect." });
    return;
  }
  const temporaryPassword = generateTempPassword();
  const user = await prisma.$transaction(async (transaction) => {
    const created = await transaction.user.create({
      data: {
        phone: input.phone,
        name: input.name,
        role: "admin",
        passwordHash: await bcrypt.hash(temporaryPassword, bcryptRounds),
        mustChangePassword: true,
      },
      select: { id: true, phone: true, role: true },
    });
    await transaction.adminAuditLog.create({
      data: {
        actingAdminId: request.user!.id,
        createdUserId: created.id,
        action: "admin_created_admin",
      },
    });
    return created;
  });
  response.status(201).json({ ...user, temporaryPassword });
}
