// Creates the application Prisma client through Prisma Accelerate.
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../generated/prisma/client";

const accelerateUrl = process.env.DATABASE_URL;

if (!accelerateUrl) {
  throw new Error("DATABASE_URL must be set to a Prisma Accelerate URL.");
}

export const prisma = new PrismaClient({ accelerateUrl }).$extends(
  withAccelerate(),
);
