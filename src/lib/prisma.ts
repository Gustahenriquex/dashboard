import { env } from "@/config/env";

let prismaClient: unknown;

export async function getPrisma() {
  if (prismaClient) {
    return prismaClient as any;
  }

  const { PrismaClient } = await import("@prisma/client");

  prismaClient = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return prismaClient as any;
}
