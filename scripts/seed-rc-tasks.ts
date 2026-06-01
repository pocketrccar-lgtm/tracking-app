/**
 * Seed the RC-launch 90-day EXECUTION SYSTEM (101 tasks) into the Task board.
 *
 * Source of truth: SOURCING_HQ/EXECUTION_PLAN/tasks_seed.json
 * Idempotent: clears prior tasks tagged [RC-SEED] in notes, then re-inserts.
 *
 * Run:  npm run db:seed-tasks      (or  npx tsx scripts/seed-rc-tasks.ts)
 * Override source:  TASKS_JSON=/path/to/tasks.json npm run db:seed-tasks
 */
import { config } from "dotenv";
// load env (POSTGRES_PRISMA_URL) by absolute path so cwd doesn't matter
config({ path: "/Users/syedibrahim/Desktop/bch-sourcing-os/.env" });

import { PrismaClient } from "../src/generated/prisma";
import { readFileSync, writeFileSync } from "fs";

const db = new PrismaClient();

const TASKS_PATH =
  process.env.TASKS_JSON ||
  "/Users/syedibrahim/Desktop/SOURCING_HQ/EXECUTION_PLAN/tasks_seed.json";

const SEED_TAG = "[RC-SEED]";

// Business categories that double as the Task.type tag on the board.
const CATEGORIES = new Set([
  "LEGAL", "FINANCE", "OPS", "INVENTORY",
  "MARKETING", "CONTENT", "PRODUCT", "SOURCING", "STRATEGY",
]);

type SeedTask = {
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string;
  assignedTo: string;
  phase: string;
  dependsOn: string[];
};

// Founder-confirmed correction: "5 stores" = 5 ONLINE D2C storefronts.
function normalizeFiveStores(tasks: SeedTask[]): SeedTask[] {
  const OLD_DEF = "5 stores definition - align channel meaning";
  const NEW_DEF = "Design the 5 online D2C storefront architecture (per-SKU / sub-brand)";
  for (const t of tasks) {
    if (t.title === OLD_DEF) {
      t.title = NEW_DEF;
      t.description =
        "[STRATEGY] DEPENDS-ON: none. DONE-WHEN: 5 online D2C storefront concepts defined — domain, SKU/sub-brand focus, positioning, shared-vs-separate backend. (Founder-confirmed: 5 = online D2C storefronts, not physical/wholesale.) See 01/06.";
    }
    if (t.title === "5 stores rollout per definition") {
      t.title = "Launch the 5 online D2C storefronts (per-SKU / sub-brand)";
      t.description =
        "[STRATEGY] DEPENDS-ON: 5-storefront architecture + SKU mix. DONE-WHEN: 5 online D2C storefronts live, each with its own funnel/landing + payment + pixel. See 01.";
    }
    t.dependsOn = (t.dependsOn || []).map((d) => (d === OLD_DEF ? NEW_DEF : d));
  }
  return tasks;
}

function upsertUser(email: string, name: string, role: string) {
  return db.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role },
  });
}

async function main() {
  const tasks = normalizeFiveStores(
    JSON.parse(readFileSync(TASKS_PATH, "utf8")) as SeedTask[]
  );
  // persist the normalized JSON back so the artifact matches the DB
  writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2) + "\n", "utf8");
  console.log(`Loaded ${tasks.length} tasks from ${TASKS_PATH}`);

  // Owners → User records (reuse existing Syed/Shoaib emails from prisma/seed.ts)
  const syed = await upsertUser("syed@pokketrccar.com", "Syed Ibrahim", "partner");
  const shoaib = await upsertUser("shoaib@pokketrccar.com", "Shoaib", "partner");
  const ca = await upsertUser("ca@pokketrccar.com", "CA / Accountant", "advisor");
  const shared = await upsertUser("shared@pokketrccar.com", "Shared (Syed + Shoaib)", "partner");

  const ownerMap: Record<string, string> = {
    Syed: syed.id,
    Shoaib: shoaib.id,
    CA: ca.id,
    Shared: shared.id,
  };

  // Idempotency: clear previously seeded tasks
  const del = await db.task.deleteMany({ where: { notes: { contains: SEED_TAG } } });
  console.log(`Cleared ${del.count} prior ${SEED_TAG} tasks`);

  const data = tasks.map((t) => {
    const m = t.description.match(/^\[([A-Z/]+)\]/);
    const cat = m?.[1];
    const type = cat && CATEGORIES.has(cat) ? cat : t.type;
    const deps = (t.dependsOn || []).length ? t.dependsOn.join("; ") : "—";
    return {
      title: t.title,
      description: t.description,
      type,
      priority: t.priority,
      status: "PENDING",
      dueDate: new Date(`${t.dueDate}T00:00:00`),
      assignedToId: ownerMap[t.assignedTo] ?? null,
      notes: `${SEED_TAG} Phase: ${t.phase} | Action-type: ${t.type} | Owner: ${t.assignedTo} | Depends: ${deps}`,
    };
  });

  const res = await db.task.createMany({ data });
  console.log(`Inserted ${res.count} tasks`);

  // ─── Verify ───
  const total = await db.task.count({ where: { notes: { contains: SEED_TAG } } });
  const idToName: Record<string, string> = {
    [syed.id]: "Syed", [shoaib.id]: "Shoaib", [ca.id]: "CA", [shared.id]: "Shared",
  };
  const byOwner = await db.task.groupBy({
    by: ["assignedToId"],
    where: { notes: { contains: SEED_TAG } },
    _count: { _all: true },
  });
  const byType = await db.task.groupBy({
    by: ["type"],
    where: { notes: { contains: SEED_TAG } },
    _count: { _all: true },
  });
  const byPriority = await db.task.groupBy({
    by: ["priority"],
    where: { notes: { contains: SEED_TAG } },
    _count: { _all: true },
  });

  console.log(`\n✓ Verified ${total} seeded tasks in DB`);
  console.log("  By owner:", byOwner.map((g) => `${idToName[g.assignedToId ?? ""] ?? "—"}=${g._count._all}`).join(", "));
  console.log("  By category:", byType.map((g) => `${g.type}=${g._count._all}`).join(", "));
  console.log("  By priority:", byPriority.map((g) => `${g.priority}=${g._count._all}`).join(", "));

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
