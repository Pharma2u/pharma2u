// Creates the application Prisma client using the PostgreSQL driver adapter.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set.");
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
