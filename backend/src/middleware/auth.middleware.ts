// Authenticates Bearer tokens and optionally restricts access by role.
import type { NextFunction, Request, Response } from "express";
import type { Role } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { verifyAuthToken } from "../utils/jwt";

export function authMiddleware(...allowedRoles: Role[]) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authorization = request.header("authorization");
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    const token = authorization ? match?.[1] : request.cookies?.token;

    if (!token) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }
    try {
      const payload = verifyAuthToken(token);

      const currentUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { role: true },
      });
      if (!currentUser) {
        response.status(401).json({ message: "Account no longer exists." });
        return;
      }
      if (allowedRoles.length && !allowedRoles.includes(currentUser.role)) {
        response.status(403).json({
          code: "ROLE_FORBIDDEN",
          currentRole: currentUser.role,
          allowedRoles,
          message: "This session cannot access an endpoint for another role.",
        });
        return;
      }
      const role = currentUser.role;
      request.user = { id: payload.userId, role };

      next();
    } catch {
      response
        .status(401)
        .json({ message: "Invalid or expired authentication token." });
    }
  };
}
