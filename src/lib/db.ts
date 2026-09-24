import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// UNSCOPED client. App code must not import this for business data — use `vdb()` /
// `scope()` from "@/lib/vertical", which filters every query to the selected vertical.
// It is deliberately NOT named `db` so an unported call site fails the build.
export const rawDb = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawDb;
}
