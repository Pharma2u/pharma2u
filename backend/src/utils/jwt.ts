// Signs and verifies minimal authentication JWT payloads.
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/client";

export type AuthTokenPayload = { userId: string; role: Role };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be set.");
  return secret;
}

export function assertJwtSecret(): void {
  getJwtSecret();
}

export function createAuthToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, getJwtSecret(), {
    expiresIn: role === "admin" ? "12h" : "30d",
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getJwtSecret());
  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    !["customer", "vendor", "rider", "admin"].includes(payload.role as string)
  )
    throw new Error("Invalid token payload.");
  return { userId: payload.userId, role: payload.role as Role };
}
