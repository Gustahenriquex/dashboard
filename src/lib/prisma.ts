import { env } from "@/config/env";

type PrismaClientLike = any;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientLike;
};

export async function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const { PrismaClient } = await import("@prisma/client");

  const prisma = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}
