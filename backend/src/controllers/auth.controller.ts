// Handles account registration, login, password changes, and admin provisioning.
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
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

async function accountDetailsAvailable(
  phone: string,
  email: string,
): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, { email }] },
    select: { id: true },
  });
  return !existing;
}

export async function register(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateRegister(request.body);
  if (!(await accountDetailsAvailable(input.phone, input.email))) {
    duplicate(response);
    return;
  }
  const { password, ...customerDetails } = input;
  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  const user = await prisma.user.create({
    data: {
      ...customerDetails,
      role: "customer",
      passwordHash,
      mustChangePassword: false,
    },
    select: publicUser,
  });
  const token = createAuthToken(user.id, user.role);
  response.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  response.status(201).json({
    token,
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
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: input.identifier }, { email: input.identifier }] },
  });
  // Keep both failures on the same bcrypt timing path to avoid phone-account enumeration.
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? dummyHash,
  );
  if (!user || !passwordMatches) {
    response
      .status(401)
      .json({ message: "Invalid email, phone, or password." });
    return;
  }
  if (user.role !== input.expectedRole) {
    response.status(403).json({
      message: "This account belongs to a different portal.",
    });
    return;
  }
  if (user.role === "rider" && user.applicationStatus !== "approved") {
    const message =
      user.applicationStatus === "rejected"
        ? "Rider application was rejected."
        : "Rider application is awaiting approval.";
    response.status(403).json({ error: message });
    return;
  }
  const token = createAuthToken(user.id, user.role);
  response.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: (user.role === "admin" ? 12 : 30 * 24) * 60 * 60 * 1000 // 12h or 30 days
  });

  response.json({
    token,
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
  if (!(await accountDetailsAvailable(input.phone, input.email))) {
    duplicate(response);
    return;
  }
  const actingAdmin = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: { passwordHash: true },
  });
  if (
    !actingAdmin ||
    !(await bcrypt.compare(input.currentPassword, actingAdmin.passwordHash))
  ) {
    response.status(400).json({ message: "currentPassword is incorrect." });
    return;
  }

  const temporaryPassword = generateTempPassword();
  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      name: input.name,
      role: input.role,
      passwordHash: await bcrypt.hash(temporaryPassword, bcryptRounds),
      email: input.email,
      applicationStatus: "approved",
      mustChangePassword: true,
    },
    select: { id: true, phone: true, email: true, role: true },
  });
  // The plaintext credential is deliberately returned only here and never persisted separately.
  await prisma.adminAuditLog.create({
    data: {
      actingAdminId: request.user!.id,
      createdUserId: user.id,
      action: "admin_created_rider",
    },
  });

  response.status(201).json({ ...user, temporaryPassword });
}

export async function provisionAdmin(
  request: Request,
  response: Response,
): Promise<void> {
  const input = validateProvisionAdmin(request.body);
  if (
    await prisma.user.findUnique({
      where: { phone: input.phone },
      select: { id: true },
    })
  ) {
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
  const user = await prisma.$transaction(
    async (transaction: Prisma.TransactionClient) => {
      const created = await transaction.user.create({
        data: {
          phone: input.phone,
          name: input.name,
          role: "admin",
          passwordHash: await bcrypt.hash(temporaryPassword, bcryptRounds),
          mustChangePassword: true,
        },
        select: { id: true, phone: true, email: true, role: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          actingAdminId: request.user!.id,
          createdUserId: created.id,
          action: "admin_created_admin",
        },
      });
      return created;
    },
  );
  response.status(201).json({ ...user, temporaryPassword });
}
