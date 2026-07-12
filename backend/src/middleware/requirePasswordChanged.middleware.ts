// Blocks protected actions until a temporary password has been replaced.
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function requirePasswordChanged(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {

  
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: { mustChangePassword: true },
  });

  if (!user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  if (user.mustChangePassword) {
    response
      .status(403)
      .json({
        message: "Password change required before accessing this resource.",
      });
    return;
  }

  next();
}
