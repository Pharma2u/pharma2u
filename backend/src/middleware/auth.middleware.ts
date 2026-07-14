// Authenticates Bearer tokens and optionally restricts access by role.
import type { NextFunction, Request, Response } from "express";
import type { Role } from "../generated/prisma/client";
import { verifyAuthToken } from "../utils/jwt";

export function authMiddleware(...allowedRoles: Role[]) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const authorization = request.header("authorization");
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    const token = match ? match[1] : request.cookies?.token;
    
    if (!token) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }
    try {
      const payload = verifyAuthToken(token);

      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        response
          .status(403)
          .json({
            message: "You do not have permission to access this resource.",
          });
        return;
      }

      request.user = { id: payload.userId, role: payload.role };

      next();
      
    } catch {
      response
        .status(401)
        .json({ message: "Invalid or expired authentication token." });
    }
  };
}
