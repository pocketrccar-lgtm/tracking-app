/**
 * Import a supply-side vendor list into ONE vertical.
 *
 *   npx tsx scripts/import-vertical.ts <verticalId> <path/to/import.json>          # write
 *   DRY=1 npx tsx scripts/import-vertical.ts <verticalId> <path/to/import.json>    # plan only
 *
 * Same safety rules as import-ev-scooters.ts (db-council, 2026-09-24), for any vertical:
 *  - The vertical must already exist (create it with a reviewed SQL file first); the client is
 *    scoped to it, so the script cannot see or touch another vertical's rows.
 *  - INSERT-ONLY: a vendor whose name already exists in the vertical is skipped, never updated.
 *    Re-running is therefore safe and changes nothing the second time.
 *  - Chunks of 50, each in its own transaction.
 *  - Exits non-zero if any row fails, and prints SOURCE / INSERTED / SKIPPED / FAILED.
 *
 * Data files are NOT in the repo (the repo is public).
 */
import { readFileSync } from "node:fs";
import { scopedDb } from "../src/lib/vertical";
import { DRIFT_STATUSES, MARKET_LEVELS, VENDOR_STATUSES, VENDOR_TIERS, VENDOR_TYPES, WRONG_REASONS } from "../src/lib/enums";

const DRY = process.env.DRY === "1";
const CHUNK = 50;

type Row = {
  name: string;
  type: string;
  tier: string;
  status: string;
  wrongReason: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  driftStatus: string;
  marketLevel: string | null;
  rank: number | null;
  rankReason?: string | null;
  websiteUrl: string | null;
  founderName: string | null;
  founderTitle: string | null;
  founderLinkedin: string | null;
  gst?: string | null;
  notes: string | null;
  sourceMd: string | null;
  sourceUrl?: string | null;
  phones: { phone: string; label: string | null; verified: boolean }[];
  emails: { email: string; label: string | null }[];
};

async function main() {
  const [verticalId, path] = process.argv.slice(2);
  if (!verticalId || !path) throw new Error("Usage: npx tsx scripts/import-vertical.ts <verticalId> <import.json>");
  const rows = JSON.parse(readFileSync(path, "utf8")) as Row[];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Input has no rows — refusing to report success on nothing.");

  // Refuse input this script would silently drop or store out of domain (no CHECK constraints in the DB).
  const KNOWN = new Set(["name", "type", "tier", "status", "wrongReason", "city", "state", "address", "driftStatus", "marketLevel",
    "rank", "rankReason", "websiteUrl", "founderName", "founderTitle", "founderLinkedin", "gst", "notes", "sourceMd", "sourceUrl",
    "phones", "emails", "interaction"]);
  const PHONE_LABELS = new Set(["sales", "corporate", "main", "whatsapp", "founder", "dealer", "spares", "wholesale", "retail"]);
  const problems: string[] = [];
  for (const r of rows) {
    const bad = (why: string) => problems.push(`${r.name}: ${why}`);
    for (const k of Object.keys(r)) if (!KNOWN.has(k)) bad(`unmapped key "${k}"`);
    if ((r as { interaction?: unknown }).interaction != null) bad("has call history (interaction) — this importer does not write it");
    if (!(VENDOR_TYPES as readonly string[]).includes(r.type)) bad(`type "${r.type}"`);
    if (!(VENDOR_TIERS as readonly string[]).includes(r.tier)) bad(`tier "${r.tier}"`);
    if (!(VENDOR_STATUSES as readonly string[]).includes(r.status)) bad(`status "${r.status}"`);
    if (!(DRIFT_STATUSES as readonly string[]).includes(r.driftStatus)) bad(`driftStatus "${r.driftStatus}"`);
    if (r.marketLevel != null && !(MARKET_LEVELS as readonly string[]).includes(r.marketLevel)) bad(`marketLevel "${r.marketLevel}"`);
    if (r.wrongReason != null && !(WRONG_REASONS as readonly string[]).includes(r.wrongReason)) bad(`wrongReason "${r.wrongReason}"`);
    for (const p of r.phones) if (p.label != null && !PHONE_LABELS.has(p.label)) bad(`phone label "${p.label}"`);
  }
  if (problems.length) throw new Error(`Input rejected (${problems.length} problems):\n  ${problems.slice(0, 20).join("\n  ")}`);

  // Duplicate names inside the file would violate @@unique([verticalId, name]).
  const seen = new Set<string>();
  const dupesInFile = rows.filter((r) => (seen.has(r.name) ? true : (seen.add(r.name), false)));
  if (dupesInFile.length) throw new Error(`Input has duplicate names: ${dupesInFile.map((d) => d.name).join(", ")}`);

  const db = scopedDb(verticalId);
  const vertical = await db.vertical.findUnique({ where: { id: verticalId } });
  if (!vertical) throw new Error(`Vertical "${verticalId}" does not exist — apply its SQL file first.`);

  const before = await db.vendor.count();
  const existing = new Set((await db.vendor.findMany({ select: { name: true } })).map((v) => v.name));
  const toInsert = rows.filter((r) => !existing.has(r.name));
  const skipped = rows.length - toInsert.length;

  console.log(`${DRY ? "[DRY RUN] " : ""}vertical=${verticalId}  source=${rows.length}  already-present=${skipped}  to-insert=${toInsert.length}  in-db-before=${before}`);
  if (DRY) {
    const phones = toInsert.reduce((s, r) => s + r.phones.length, 0);
    const verified = toInsert.reduce((s, r) => s + r.phones.filter((p) => p.verified).length, 0);
    const emails = toInsert.reduce((s, r) => s + r.emails.length, 0);
    console.log(`would insert: vendors=${toInsert.length} phones=${phones} (verified ${verified}) emails=${emails}`);
    return;
  }

  let inserted = 0;
  const failed: { name: string; error: string }[] = [];
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    try {
      await db.$transaction(
        chunk.map((r) =>
          db.vendor.create({
            data: {
              name: r.name,
              type: r.type,
              tier: r.tier,
              status: r.status,
              wrongReason: r.wrongReason,
              city: r.city,
              state: r.state,
              address: r.address,
              driftStatus: r.driftStatus,
              marketLevel: r.marketLevel,
              rank: r.rank,
              rankReason: r.rankReason ?? null,
              websiteUrl: r.websiteUrl,
              founderName: r.founderName,
              founderTitle: r.founderTitle,
              founderLinkedin: r.founderLinkedin,
              gst: r.gst ?? null,
              notes: r.notes,
              sourceMd: r.sourceMd,
              sourceUrl: r.sourceUrl ?? null,
              phones: { create: r.phones.map((p) => ({ phone: p.phone, label: p.label, verified: p.verified })) },
              emails: { create: r.emails.map((e) => ({ email: e.email, label: e.label })) },
            },
          }),
        ),
      );
      inserted += chunk.length;
      console.log(`  chunk ${i / CHUNK + 1}: +${chunk.length} (total ${inserted}/${toInsert.length})`);
    } catch (e) {
      // A failed chunk rolls back as a whole — record every row in it as failed.
      const msg = e instanceof Error ? e.message.split("\n").slice(-1)[0] : String(e);
      for (const r of chunk) failed.push({ name: r.name, error: msg });
      console.error(`  chunk ${i / CHUNK + 1}: FAILED — ${msg}`);
    }
  }

  const after = await db.vendor.count();
  console.log(`\nSOURCE=${rows.length}  INSERTED=${inserted}  SKIPPED=${skipped}  FAILED=${failed.length}`);
  console.log(`vendors in ${verticalId}: before=${before} after=${after} (expected ${before + inserted})`);
  if (after !== before + inserted) {
    console.error("RECONCILIATION FAILED: vendor count does not match inserted rows.");
    process.exit(1);
  }
  if (inserted + skipped + failed.length !== rows.length) {
    console.error("RECONCILIATION FAILED: source != inserted + skipped + failed.");
    process.exit(1);
  }
  if (failed.length) {
    for (const f of failed.slice(0, 20)) console.error(`  FAILED ${f.name}: ${f.error}`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
