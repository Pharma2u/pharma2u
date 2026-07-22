import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

const roles = ["admin", "vendor", "rider", "customer"] as const;

export async function listRoleUsers(request: Request, response: Response) {
  const role = request.query.role;
  if (typeof role !== "string" || !roles.includes(role as (typeof roles)[number])) {
    response.status(400).json({ error: "A valid role is required." });
    return;
  }
  const users = await prisma.user.findMany({
    where: { role: role as (typeof roles)[number] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, email: true, role: true,
      isActive: true, applicationStatus: true, createdAt: true,
      pharmacies: { select: { name: true, address: true } },
    },
  });
  response.json({ items: users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    pharmacies: user.pharmacies,
  })) });
}

export async function setUserAccess(request: Request, response: Response) {
  const id = String(request.params.id);
  const isActive = request.body?.isActive;
  if (typeof isActive !== "boolean") {
    response.status(400).json({ error: "isActive must be a boolean." });
    return;
  }
  if (id === request.user!.id) {
    response.status(400).json({ error: "You cannot revoke your own access." });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
  if (!user) {
    response.status(404).json({ error: "User not found." });
    return;
  }
  if (!isActive && user.role === "admin" && user.isActive) {
    const activeAdmins = await prisma.user.count({ where: { role: "admin", isActive: true } });
    if (activeAdmins <= 1) {
      response.status(400).json({ error: "The last active administrator cannot be revoked." });
      return;
    }
  }
  const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: { id: true, isActive: true } });
  response.json(updated);
}