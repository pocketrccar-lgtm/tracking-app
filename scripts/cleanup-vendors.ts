// Clean up: drop generic "market location" entries + exact-normalized duplicates
// (keeps the richest copy: ranked > has-phone > longer-notes > oldest).
import { PrismaClient } from "../src/generated/prisma";
const db = new PrismaClient();
const norm = (s: string) => (s || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, "");

// names that are markets/areas, not a specific business
const MARKET = /^(wholesale|wholsale)\b.*\bmarket\b|^cycle and toy market$|^toy market$|^main market$|^wholesale toy market$|^sadar bazar\b.*market$/i;

async function main() {
  const all = await db.vendor.findMany({
    select: { id: true, name: true, rank: true, notes: true, createdAt: true, _count: { select: { phones: true } } },
  });

  // 1) markets
  const markets = all.filter((v) => MARKET.test(v.name.trim()));
  for (const m of markets) await db.vendor.delete({ where: { id: m.id } });
  const live = all.filter((v) => !MARKET.test(v.name.trim()));

  // 2) exact-normalized duplicates
  const groups = new Map<string, typeof live>();
  for (const v of live) {
    const k = norm(v.name);
    if (k.length < 4) continue;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(v);
  }
  let dupDeleted = 0;
  for (const [, g] of groups) {
    if (g.length < 2) continue;
    g.sort((a, b) =>
      (b.rank != null ? 1 : 0) - (a.rank != null ? 1 : 0) ||
      b._count.phones - a._count.phones ||
      (b.notes?.length ?? 0) - (a.notes?.length ?? 0) ||
      a.createdAt.getTime() - b.createdAt.getTime(),
    );
    for (const v of g.slice(1)) { await db.vendor.delete({ where: { id: v.id } }); dupDeleted++; }
  }

  const total = await db.vendor.count();
  console.log(`Deleted ${markets.length} market-locations + ${dupDeleted} exact duplicates. DB total: ${total}`);
}
main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
