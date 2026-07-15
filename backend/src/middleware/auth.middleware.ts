// Authenticates Bearer tokens and optionally restricts access by role.
import type { NextFunction, Request, Response } from "express";
import type { Role } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { verifyAuthToken } from "../utils/jwt";

export function authMiddleware(...allowedRoles: Role[]) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const authorization = request.header("authorization");
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    const token = match ? match[1] : request.cookies?.token;
    
    if (!token) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }
    try {
      const payload = verifyAuthToken(token);

      let role = payload.role;
      if (allowedRoles.length && !allowedRoles.includes(role)) {
        // Roles can change after a token was issued. Refresh the role from the
        // database before rejecting an otherwise valid, non-expired session.
        const currentUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { role: true },
        });
        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
          response.status(403).json({
            message: "You do not have permission to access this resource.",
          });
          return;
        }
        role = currentUser.role;
      }

      request.user = { id: payload.userId, role };

      next();
      
    } catch {
      response
        .status(401)
        .json({ message: "Invalid or expired authentication token." });
    }
  };
}
