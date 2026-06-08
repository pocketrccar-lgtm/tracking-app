// Apify Google Maps scraper → biggest B2B toy/RC suppliers per city, with phones.
// Usage: tsx --env-file=.env scripts/apify-maps.ts mumbai
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();
const ACTOR = "compass~crawler-google-places";

const TERMS: Record<string, string[]> = {
  mumbai: [
    "toy wholesaler Mumbai", "toy distributor Mumbai", "toy manufacturer Mumbai",
    "remote control car wholesaler Mumbai", "remote control toys distributor Mumbai",
    "battery operated toy car manufacturer Mumbai", "toy importer Mumbai",
    "toys wholesale market Mumbai", "kids toys wholesaler Mumbai",
    "toy wholesaler Bhiwandi", "toy wholesaler Thane", "toy wholesaler Navi Mumbai",
    "RC car distributor Mumbai", "toy trading company Mumbai",
    "remote control car supplier Mumbai", "toy wholesaler Crawford Market Mumbai",
  ],
  delhi: [
    "toy wholesaler Delhi", "toy distributor Delhi", "toy manufacturer Delhi",
    "remote control car wholesaler Delhi", "remote control toys distributor Delhi",
    "battery operated toy car manufacturer Delhi", "toy importer Delhi",
    "toys wholesale market Sadar Bazar Delhi", "kids toys wholesaler Delhi",
    "toy wholesaler Jhandewalan Delhi", "toy wholesaler Mayapuri Delhi",
    "toy wholesaler Karol Bagh Delhi", "RC car distributor Delhi",
    "toy trading company Delhi", "remote control car supplier Delhi", "toy manufacturer Noida",
  ],
};

const norm = (s: string) => (s || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

function tokens(): string[] {
  const k = JSON.parse(readFileSync("/Users/syedibrahim/Desktop/SOURCING_HQ/scripts/keys.json", "utf8"));
  const pool = k.apify || [];
  return (Array.isArray(pool) ? pool : [pool]).map((t: unknown) =>
    typeof t === "string" ? t : (t as { token?: string; key?: string })?.token || (t as { key?: string })?.key,
  ).filter(Boolean) as string[];
}

function typeFor(term: string): string {
  if (/manufacturer/i.test(term)) return "MANUFACTURER";
  if (/distributor/i.test(term)) return "DISTRIBUTOR";
  if (/importer|supplier|trading/i.test(term)) return "TRADER";
  if (/wholesal/i.test(term)) return "WHOLESALER";
  return "WHOLESALER";
}

const RETAIL_CAT = /toy store|gift shop|game store|baby store|stationery|variety store|department store|children's store/i;
const B2B_NAME = /wholesal|distribut|manufactur|trading|traders|enterprise|impex|industr|agenc|importer|exporter|supplier|corporation|overseas|& co|and co|sons/i;

async function runActor(token: string, searchStringsArray: string[]) {
  const input = { searchStringsArray, maxCrawledPlacesPerSearch: 30, language: "en", skipClosedPlaces: true };
  const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (!start.ok) throw new Error(`start ${start.status}`);
  const run = (await start.json()).data;
  const runId = run.id, dsId = run.defaultDatasetId;
  console.log(`  run ${runId} started (dataset ${dsId})`);
  // poll up to ~9 min
  const deadline = Date.now() + 9 * 60 * 1000;
  let status = run.status;
  while (Date.now() < deadline && !["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
    await sleep(15000);
    const st = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    status = (await st.json()).data.status;
    process.stdout.write(`  …${status}`);
  }
  console.log("");
  const items = await fetch(`https://api.apify.com/v2/datasets/${dsId}/items?clean=true&token=${token}`);
  return (await items.json()) as any[];
}

async function main() {
  const city = (process.argv[2] || "mumbai").toLowerCase();
  const reuse = process.argv[3] === "reuse";
  const terms = TERMS[city];
  if (!terms) throw new Error(`unknown city ${city}`);

  // idempotent: drop any prior import from this exact source before re-importing
  const purged = await db.vendor.deleteMany({ where: { notes: { contains: `apify-maps-${city}` } } });
  if (purged.count) console.log(`Purged ${purged.count} prior apify-maps-${city} rows`);

  let places: any[] = [];
  if (reuse) {
    places = JSON.parse(readFileSync(`data/maps_${city}_raw.json`, "utf8"));
    console.log(`Reusing ${places.length} cached raw places`);
  } else {
    const toks = tokens();
    console.log(`Apify Maps — ${city} · ${terms.length} terms · ${toks.length} tokens`);
    for (let ti = 0; ti < toks.length; ti++) {
      try {
        places = await runActor(toks[ti], terms);
        console.log(`Got ${places.length} raw places on token #${ti + 1}`);
        break;
      } catch (e) {
        console.log(`token #${ti + 1} failed (${(e as Error).message}); rotating…`);
      }
    }
    writeFileSync(`data/maps_${city}_raw.json`, JSON.stringify(places));
  }

  // dedupe vs existing DB
  const existing = await db.vendor.findMany({ select: { name: true } });
  const exKeys = existing.map((e) => norm(e.name)).filter((k) => k.length >= 4);
  const isKnown = (name: string) => { const k = norm(name); if (k.length < 4) return true; const h = k.slice(0, 14); return exKeys.some((e) => e.includes(h) || k.includes(e.slice(0, 14))); };

  const seenName = new Set<string>(), seenPhone = new Set<string>();
  let added = 0, dropRetail = 0, dropKnown = 0, dropDup = 0, dropForeign = 0;
  const accepted: any[] = [];
  // sort by reviews desc so the biggest win dedupe ties
  places.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  for (const p of places) {
    const name: string = (p.title || "").trim();
    if (!name) continue;
    if (p.countryCode !== "IN") { dropForeign++; continue; } // India only
    const cat = p.categoryName || "";
    if (RETAIL_CAT.test(cat) && !B2B_NAME.test(name)) { dropRetail++; continue; }
    if (isKnown(name)) { dropKnown++; continue; }
    const nk = norm(name).slice(0, 16);
    const phone = (p.phoneUnformatted || p.phone || "").trim();
    const pk = phone.replace(/\D/g, "").slice(-10);
    if ((nk && seenName.has(nk)) || (pk.length === 10 && seenPhone.has(pk))) { dropDup++; continue; }
    if (nk) seenName.add(nk);
    if (pk.length === 10) seenPhone.add(pk);

    const reviews = p.reviewsCount || 0;
    const rating = p.totalScore || 0;
    // which term found it → type
    const term = p.searchString || "";
    const type = typeFor(typeof term === "string" ? term : "");
    const vol = clamp(45 + 12 * Math.log10(reviews + 1) + (rating >= 4 ? 3 : 0), 40, 90);
    const addr = [p.street, p.city, p.state].filter(Boolean).join(", ");
    accepted.push({
      name, type, phone,
      city: p.city || city,
      website: p.website || "",
      reviews, rating, vol, cat, addr,
      mapsUrl: p.url || "",
    });
  }
  console.log(`Accepted ${accepted.length} (dropped ${dropForeign} foreign, ${dropKnown} known, ${dropDup} dup, ${dropRetail} retail)`);

  // import
  for (const v of accepted) {
    const phoneOk = v.phone.replace(/\D/g, "").length >= 8;
    const note = `Google Maps: ${v.cat || "business"} · ${v.reviews} reviews ${v.rating ? `· ${v.rating}★` : ""} · ${v.addr} [via apify-maps-${city}]`.slice(0, 1200);
    await db.vendor.create({
      data: {
        name: v.name, type: v.type, tier: "T3_VERIFY_DRIFT", status: "NEW",
        driftStatus: "UNKNOWN", bchRelevance: 5,
        marketLevel: "GREY", volumeScore: v.vol, acceptScore: 70,
        rankReason: `Maps: ${v.reviews} reviews${v.rating ? `, ${v.rating}★` : ""}`,
        city: v.city, state: city === "delhi" ? "Delhi" : "Maharashtra",
        websiteUrl: v.website || null,
        notes: note, sourceMd: "auto-research", sourceUrl: v.mapsUrl || v.website || null,
        ...(phoneOk ? { phones: { create: [{ phone: v.phone, label: "main" }] } } : {}),
      },
    });
    added++;
  }
  const total = await db.vendor.count();
  console.log(`\nImported ${added}. DB total: ${total}`);
  console.log(`\nTOP 15 biggest ${city} (by Maps reviews):`);
  accepted.slice(0, 15).forEach((v, i) => console.log(`  ${i + 1}. ${v.name} — ${v.reviews} reviews, ${v.rating}★ — ${v.phone || "no phone"} [${v.type}]`));
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
