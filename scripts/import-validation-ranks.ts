/**
 * Apply the Claude-validated ranking pass (Vendor_Validation_Ranked.xlsx) onto
 * existing vendors, and add the handful of brand-new vendors the panel found.
 *
 * Source JSON is produced from the xlsx by the Python step (scripts/_validation_ranked.json).
 *
 * Mapping (per the agreed decision — keeps existing T1–T4 tier untouched):
 *   Rank            → vendor.rank
 *   Score (0–90)    → vendor.volumeScore (clamped 0–100)
 *   RC Rel (0–10)   → vendor.bchRelevance (clamped 0–10)
 *   Validation Note → vendor.rankReason
 *   Drift Flag      → vendor.driftStatus (only when confidently set)
 *
 * Matching is by name: exact → normalized-exact → token-Jaccard fuzzy (≥0.7, unique).
 * Unmatched ranked rows are logged, NOT created. The "New Better Vendors" sheet IS created.
 *
 * Run dry:    DRY=1 npm run db:import-validation
 * Run apply:        npm run db:import-validation
 */
import { PrismaClient } from "../src/generated/prisma";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const db = new PrismaClient();
const DRY = process.env.DRY === "1";
const JSON_PATH = path.join(__dirname, "_validation_ranked.json");
const SOURCE_TAG = "Vendor_Validation_Ranked.xlsx";

type RankedRow = {
  rank: number | string | null;
  tier: string | null;
  score: number | string | null;
  name: string;
  type: string | null;
  region: string | null;
  location: string | null;
  phone: string | null;
  website: string | null;
  drift: string | null;
  verdict: string | null;
  rcRel: number | string | null;
  evidence: number | string | null;
  note: string | null;
  sourceUrl: string | null;
};
type NewRow = {
  name: string;
  type: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  rcRel: number | string | null;
  evidence: number | string | null;
  sourceUrl: string | null;
  note: string | null;
};

// ── helpers ──────────────────────────────────────────────────────────────────
const COMPANY_NOISE = /\b(pvt|private|ltd|limited|llp|inc|co|company|the|and|enterprises?|industries|trading|traders|toys?)\b/g;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// aggressive key for fuzzy bucketing — drops common company words too
function fuzzyTokens(name: string): Set<string> {
  const n = normalize(name).replace(COMPANY_NOISE, " ").replace(/\s+/g, " ").trim();
  return new Set(n.split(" ").filter((t) => t.length > 1));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function driftFrom(flag: string | null): string | null {
  if (!flag) return null;
  if (flag.includes("Yes") || flag.includes("🏁")) return "YES_CONFIRMED";
  if (flag.includes("Drift?")) return "LIKELY";
  if (flag.trim() === "No") return "NO";
  return null; // "—" / unknown → leave existing value
}
const TYPE_MAP: Record<string, string> = {
  mfr: "MANUFACTURER",
  manufacturer: "MANUFACTURER",
  distr: "DISTRIBUTOR",
  "distr/retailer": "DISTRIBUTOR",
  distributor: "DISTRIBUTOR",
  whlsl: "WHOLESALER",
  wholesaler: "WHOLESALER",
  trader: "TRADER",
};
function mapType(t: string | null): string {
  if (!t) return "WHOLESALER";
  return TYPE_MAP[t.toLowerCase().trim()] ?? "WHOLESALER";
}

async function main() {
  const { ranked, newVendors } = JSON.parse(readFileSync(JSON_PATH, "utf8")) as {
    ranked: RankedRow[];
    newVendors: NewRow[];
  };
  console.log(`Loaded ${ranked.length} ranked rows + ${newVendors.length} new vendors. DRY=${DRY}`);

  const vendors = await db.vendor.findMany({ select: { id: true, name: true } });
  console.log(`DB has ${vendors.length} vendors.`);

  // Build lookup maps. Where a normalized name collides, we keep a list (ambiguous).
  const byExact = new Map<string, string>(); // raw-trim lower → id
  const byNorm = new Map<string, string[]>(); // normalized → ids
  const fuzzyIndex = vendors.map((v) => ({ id: v.id, name: v.name, tokens: fuzzyTokens(v.name) }));
  for (const v of vendors) {
    byExact.set(v.name.trim().toLowerCase(), v.id);
    const k = normalize(v.name);
    (byNorm.get(k) ?? byNorm.set(k, []).get(k)!).push(v.id);
  }

  // Shared matcher: exact → normalized(unique) → containment(unique) → fuzzy(≥0.7, clear winner).
  function findVendorId(name: string): string | undefined {
    const e = byExact.get(name.trim().toLowerCase());
    if (e) return e;
    const cand = byNorm.get(normalize(name));
    if (cand && cand.length === 1) return cand[0];
    const nn = normalize(name);
    if (nn.split(" ").length >= 2) {
      const contains = fuzzyIndex.filter((c) => {
        const cn = normalize(c.name);
        return (cn.includes(nn) || nn.includes(cn)) && Math.min(nn.split(" ").length, cn.split(" ").length) >= 2;
      });
      if (contains.length === 1) return contains[0].id;
    }
    const toks = fuzzyTokens(name);
    let best = { id: "", score: 0 }, second = 0;
    for (const c of fuzzyIndex) {
      const sc = jaccard(toks, c.tokens);
      if (sc > best.score) { second = best.score; best = { id: c.id, score: sc }; }
      else if (sc > second) second = sc;
    }
    if (best.score >= 0.7 && best.score - second >= 0.05) return best.id;
    return undefined;
  }

  let exact = 0, norm = 0, fuzzy = 0;
  const unmatched: string[] = [];
  type Upd = { id: string; data: Record<string, unknown> };
  const updates: Upd[] = [];

  for (const r of ranked) {
    if (!r.name) continue;
    let id: string | undefined;
    const e = byExact.get(r.name.trim().toLowerCase());
    if (e) { id = e; exact++; }
    if (!id) {
      const cand = byNorm.get(normalize(r.name));
      if (cand && cand.length === 1) { id = cand[0]; norm++; }
    }
    if (!id) {
      // fuzzy: best unique Jaccard ≥ 0.7
      const toks = fuzzyTokens(r.name);
      let best = { id: "", score: 0 }, second = 0;
      for (const c of fuzzyIndex) {
        const sc = jaccard(toks, c.tokens);
        if (sc > best.score) { second = best.score; best = { id: c.id, score: sc }; }
        else if (sc > second) second = sc;
      }
      if (best.score >= 0.7 && best.score - second >= 0.05) { id = best.id; fuzzy++; }
    }
    if (!id) { unmatched.push(`#${r.rank ?? "?"} score=${r.score ?? "?"} [${r.type ?? "?"}] ${r.name}`); continue; }

    const data: Record<string, unknown> = {};
    const rk = num(r.rank); if (rk !== null) data.rank = Math.round(rk);
    const sc = num(r.score); if (sc !== null) data.volumeScore = clamp(Math.round(sc), 0, 100);
    const rel = num(r.rcRel); if (rel !== null) data.bchRelevance = clamp(Math.round(rel), 0, 10);
    if (r.note) data.rankReason = r.note.slice(0, 1000);
    const d = driftFrom(r.drift); if (d) data.driftStatus = d;
    updates.push({ id, data });
  }

  console.log(`\nMATCHED: ${exact} exact · ${norm} normalized · ${fuzzy} fuzzy = ${updates.length}/${ranked.length}`);
  console.log(`UNMATCHED ranked rows: ${unmatched.length}`);
  writeFileSync(path.join(__dirname, "_validation_unmatched.txt"), unmatched.join("\n"), "utf8");

  // New vendors — match-or-create by name.
  let newCreated = 0, newUpdated = 0;
  const newPlan: string[] = [];
  for (const nv of newVendors) {
    if (!nv.name) continue;
    const existingId = findVendorId(nv.name);
    const rel = num(nv.rcRel);
    if (existingId) {
      newUpdated++; newPlan.push(`UPDATE  ${nv.name}`);
      if (!DRY) await db.vendor.update({
        where: { id: existingId },
        data: {
          ...(rel !== null ? { bchRelevance: clamp(Math.round(rel), 0, 10) } : {}),
          ...(nv.website ? { websiteUrl: nv.website } : {}),
          ...(nv.note ? { rankReason: nv.note.slice(0, 1000) } : {}),
        },
      });
    } else {
      newCreated++; newPlan.push(`CREATE  ${nv.name} (${mapType(nv.type)})`);
      if (!DRY) await db.vendor.create({
        data: {
          name: nv.name,
          type: mapType(nv.type),
          tier: "T2_STRONG_SIGNAL", // panel flagged these as "better" leads
          status: "NEW",
          city: nv.city ?? undefined,
          driftStatus: "LIKELY",
          bchRelevance: rel !== null ? clamp(Math.round(rel), 0, 10) : 8,
          websiteUrl: nv.website ?? undefined,
          rankReason: nv.note?.slice(0, 1000) ?? undefined,
          sourceMd: SOURCE_TAG,
          sourceUrl: nv.sourceUrl ?? undefined,
          phones: nv.phone ? { create: [{ phone: nv.phone, label: "main" }] } : undefined,
        },
      });
    }
  }
  console.log(`\nNEW VENDORS: ${newCreated} create · ${newUpdated} update`);
  newPlan.forEach((p) => console.log("  " + p));

  if (DRY) {
    console.log(`\n[DRY RUN] No writes performed. Sample updates:`);
    updates.slice(0, 5).forEach((u) => console.log("  ", u.id, JSON.stringify(u.data)));
    await db.$disconnect();
    return;
  }

  // Apply rank/score/etc updates in chunks.
  console.log(`\nApplying ${updates.length} vendor updates…`);
  const CHUNK = 25;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    await db.$transaction(slice.map((u) => db.vendor.update({ where: { id: u.id }, data: u.data })));
    if (i % 500 === 0) console.log(`  …${i}/${updates.length}`);
  }
  console.log(`Done. Updated ${updates.length}, created ${newCreated}, refreshed ${newUpdated} new-vendor rows.`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
