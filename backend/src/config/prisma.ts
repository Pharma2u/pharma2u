// Creates the application Prisma client using Prisma 7's PostgreSQL driver adapter.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.startsWith("prisma")) {
  throw new Error(
    "DATABASE_URL must be set to a direct PostgreSQL connection string.",
  );
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
