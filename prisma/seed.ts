/**
 * Idempotent seed: 2 users + 7 default categories.
 * Run with: npx prisma db seed   (or  npm run db:seed)
 */
import { PrismaClient } from "../src/generated/prisma";
import { DEFAULT_CATEGORIES } from "../src/lib/enums";

const db = new PrismaClient();

async function main() {
  console.log("Seeding users…");
  await db.user.upsert({
    where: { email: "syed@bch.in" },
    update: { name: "Syed Ibrahim", role: "admin" },
    create: { email: "syed@bch.in", name: "Syed Ibrahim", role: "admin" },
  });
  await db.user.upsert({
    where: { email: "shoaib@bch.in" },
    update: { name: "Shoaib", role: "field" },
    create: { email: "shoaib@bch.in", name: "Shoaib", role: "field" },
  });

  console.log("Seeding categories…");
  for (const c of DEFAULT_CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, color: c.color },
      create: { name: c.name, slug: c.slug, color: c.color },
    });
  }

  console.log("✓ Seed done.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
