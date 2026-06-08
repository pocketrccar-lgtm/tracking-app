// Import a city sweep's deduped suppliers. Reads data/city_vendors.json.
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();
const VALID = new Set(["MANUFACTURER", "DISTRIBUTOR", "WHOLESALER", "TRADER"]);
// fold legacy/extra types into the clean 4
const TYPE_MAP: Record<string, string> = { OEM: "MANUFACTURER", MOULDER: "MANUFACTURER", IMPORTER: "TRADER", RETAIL: "TRADER", MIXED: "TRADER" };
const norm = (s: string) => (s || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, "");

type V = { name: string; type: string; city?: string; state?: string; area?: string; phone?: string; website?: string; indiamartUrl?: string; signal?: string; source?: string };

const stateFor = (city: string) => {
  const s = (city || "").toLowerCase();
  if (/delhi|noida|ghaziabad|gurgaon|gurugram|faridabad/.test(s)) return "Delhi";
  if (/mumbai|thane|bhiwandi|navi|vasai|virar|kalyan|dombivli|ulhasnagar|panvel|mira|bhayandar/.test(s)) return "Maharashtra";
  return null;
};

async function main() {
  const rows: V[] = JSON.parse(readFileSync("data/city_vendors.json", "utf8"));
  const existing = await db.vendor.findMany({ select: { name: true } });
  const exKeys = existing.map((e) => norm(e.name)).filter((k) => k.length >= 4);
  const isKnown = (name: string) => { const k = norm(name); if (k.length < 4) return true; const head = k.slice(0, 14); return exKeys.some((e) => e.includes(head) || k.includes(e.slice(0, 14))); };

  let added = 0, skipped = 0;
  const seen = new Set<string>();
  for (const v of rows) {
    if (!v.name?.trim()) { skipped++; continue; }
    const key = norm(v.name).slice(0, 16);
    if (seen.has(key) || isKnown(v.name)) { skipped++; continue; }
    seen.add(key);
    const mapped = TYPE_MAP[v.type] ?? v.type;
    const type = VALID.has(mapped) ? mapped : "WHOLESALER";
    const phoneOk = (v.phone || "").replace(/\D/g, "").length >= 8;
    const note = [v.signal?.trim(), v.area ? `(${v.area})` : "", v.source ? `[via ${v.source}]` : ""].filter(Boolean).join(" ").slice(0, 1200);
    await db.vendor.create({
      data: {
        name: v.name.trim(),
        type,
        tier: "T3_VERIFY_DRIFT",
        status: "NEW",
        driftStatus: "UNKNOWN",
        bchRelevance: 5,
        city: v.city?.trim() || null,
        state: stateFor(v.city || ""),
        websiteUrl: v.website?.trim() || null,
        indiamartUrl: v.indiamartUrl?.trim() || null,
        notes: note,
        sourceMd: "auto-research",
        sourceUrl: v.indiamartUrl?.trim() || v.website?.trim() || null,
        ...(phoneOk ? { phones: { create: [{ phone: v.phone!.trim(), label: "main" }] } } : {}),
      },
    });
    added++;
  }
  const total = await db.vendor.count();
  console.log(`Added ${added} (skipped ${skipped}). DB total: ${total}`);
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
