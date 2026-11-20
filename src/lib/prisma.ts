import { PrismaClient } from "@prisma/client";

// Otomatis sinkronkan POSTGRES_PRISMA_URL bawaan Vercel ke DATABASE_URL jika belum ada
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!process.env.DATABASE_URL && connectionString) {
  process.env.DATABASE_URL = connectionString;
}

// Singleton Prisma Client pattern for Next.js to prevent connection exhaustion in dev mode
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(connectionString ? { datasourceUrl: connectionString } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
