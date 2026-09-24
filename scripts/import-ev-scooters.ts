/**
 * Import the EV Scooters supply-side vendor list into the "ev-scooters" vertical.
 *
 *   npx tsx scripts/import-ev-scooters.ts <path/to/ev_scooters_import.json>          # write
 *   DRY=1 npx tsx scripts/import-ev-scooters.ts <path/to/ev_scooters_import.json>    # plan only
 *
 * Safety rules (db-council, 2026-09-24):
 *  - Locked to the ev-scooters vertical — it cannot see or touch another vertical's rows.
 *  - INSERT-ONLY: a vendor whose name already exists in ev-scooters is skipped, never updated.
 *    Re-running is therefore safe and changes nothing the second time.
 *  - Chunks of 50, each in its own transaction.
 *  - Exits non-zero if any row fails, and prints SOURCE / INSERTED / SKIPPED / FAILED.
 *
 * The data file is NOT in the repo (the repo is public). It is built from the team's
 * call sheet + manufacturer-intel spreadsheets.
 */
import { readFileSync } from "node:fs";
import { scopedDb } from "../src/lib/vertical";

const VERTICAL = "ev-scooters";
const DRY = process.env.DRY === "1";
const CHUNK = 50;
// The team's call sheet export these dispositions came from.
const CALLED_AT = new Date("2026-08-06T10:00:00+05:30");

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
  websiteUrl: string | null;
  founderName: string | null;
  founderTitle: string | null;
  founderLinkedin: string | null;
  notes: string | null;
  sourceMd: string | null;
  phones: { phone: string; label: string | null; verified: boolean }[];
  emails: { email: string; label: string | null }[];
  interaction: { outcome: string | null; notes: string } | null;
};

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: npx tsx scripts/import-ev-scooters.ts <ev_scooters_import.json>");
  const rows = JSON.parse(readFileSync(path, "utf8")) as Row[];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Input has no rows — refusing to report success on nothing.");

  const db = scopedDb(VERTICAL);
  const vertical = await db.vertical.findUnique({ where: { id: VERTICAL } });
  if (!vertical) throw new Error(`Vertical "${VERTICAL}" does not exist — apply the schema change first.`);

  // Interactions need an author; the shared partner account logged these calls.
  const author = await db.user.findFirst({ where: { name: { startsWith: "Shared" } } });
  if (!author) throw new Error('No "Shared (Syed + Shoaib)" user found to attribute the call history to.');

  // Duplicate names inside the file would violate @@unique([verticalId, name]).
  const seen = new Set<string>();
  const dupesInFile = rows.filter((r) => (seen.has(r.name) ? true : (seen.add(r.name), false)));
  if (dupesInFile.length) throw new Error(`Input has duplicate names: ${dupesInFile.map((d) => d.name).join(", ")}`);

  const before = await db.vendor.count();
  const existing = new Set((await db.vendor.findMany({ select: { name: true } })).map((v) => v.name));
  const toInsert = rows.filter((r) => !existing.has(r.name));
  const skipped = rows.length - toInsert.length;

  console.log(`${DRY ? "[DRY RUN] " : ""}vertical=${VERTICAL}  source=${rows.length}  already-present=${skipped}  to-insert=${toInsert.length}  in-db-before=${before}`);
  if (DRY) {
    const withInteraction = toInsert.filter((r) => r.interaction).length;
    const phones = toInsert.reduce((s, r) => s + r.phones.length, 0);
    const emails = toInsert.reduce((s, r) => s + r.emails.length, 0);
    console.log(`would insert: vendors=${toInsert.length} phones=${phones} emails=${emails} call-history=${withInteraction}`);
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
              websiteUrl: r.websiteUrl,
              founderName: r.founderName,
              founderTitle: r.founderTitle,
              founderLinkedin: r.founderLinkedin,
              notes: r.notes,
              sourceMd: r.sourceMd,
              phones: { create: r.phones.map((p) => ({ phone: p.phone, label: p.label, verified: p.verified })) },
              emails: { create: r.emails.map((e) => ({ email: e.email, label: e.label })) },
              ...(r.interaction
                ? {
                    interactions: {
                      create: [
                        {
                          userId: author.id,
                          type: "CALL",
                          occurredAt: CALLED_AT,
                          outcome: r.interaction.outcome,
                          notes: `${r.interaction.notes} (imported from the team call sheet)`,
                        },
                      ],
                    },
                  }
                : {}),
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
  console.log(`vendors in ${VERTICAL}: before=${before} after=${after} (expected ${before + inserted})`);
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
