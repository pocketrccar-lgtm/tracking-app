// Generates a city-focused supplier-extraction workflow file with the existing
// vendor names embedded (dedupe) + the city's market/area sub-queries.
// Usage: tsx scripts/_gen_city.ts mumbai
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

const CITY_QUERIES: Record<string, { city: string; cityMatch: string; queries: { k: string; q: string }[] }> = {
  mumbai: {
    city: "Mumbai (Greater Mumbai / MMR)",
    cityMatch: "mumbai|navi mumbai|thane|bhiwandi|kalyan|dombivli|ulhasnagar|vasai|virar|mira|bhayandar|panvel|vashi|turbhe",
    queries: [
      { k: "im-whole", q: "IndiaMART remote-control car & RC toy WHOLESALERS / suppliers in MUMBAI — company names, area, indiamart supplier URL." },
      { k: "im-mfg", q: "IndiaMART remote-control / RC / battery toy car MANUFACTURERS in Mumbai, Bhiwandi, Thane, Vasai — names + indiamart URL." },
      { k: "im-dist", q: "IndiaMART toy DISTRIBUTORS / wholesale dealers in Mumbai (that carry RC / remote-control cars)." },
      { k: "im-battery", q: "IndiaMART battery-operated toy car & ride-on suppliers/manufacturers Mumbai + MMR." },
      { k: "im-import", q: "IndiaMART RC car IMPORTERS / exporters based in Mumbai / Navi Mumbai." },
      { k: "tradeindia", q: "TradeIndia + ExportersIndia: remote control car / toy suppliers, wholesalers, manufacturers in Mumbai." },
      { k: "crawford", q: "Crawford Market (Mahatma Jyotiba Phule Market) Mumbai toy IMPORTERS & WHOLESALERS — shop/company names + the RC/toy lines they carry." },
      { k: "kalbadevi", q: "Kalbadevi, Bhuleshwar, Zaveri Bazaar Mumbai TOY WHOLESALE shops & distributors — names + addresses." },
      { k: "nullbazaar", q: "Null Bazaar, Bhendi Bazaar, Masjid Bunder, Mandvi Mumbai toy/RC wholesalers & importers — names." },
      { k: "mangaldas", q: "Mangaldas Market + Mumbai Princess Street / Kalbadevi Rd toy & novelty wholesalers carrying RC cars." },
      { k: "lamington", q: "Lamington Road / Grant Road / Mohammed Ali Road Mumbai electronics & toy wholesalers that stock RC cars." },
      { k: "dadar", q: "Dadar / Parel / Lalbaug Mumbai toy wholesalers & distributors (RC / battery cars)." },
      { k: "andheri", q: "Andheri / Goregaon / Malad / Jogeshwari Mumbai RC & toy distributors / importers (B2B)." },
      { k: "borivali", q: "Borivali / Kandivali / Dahisar / Mira Road Mumbai toy wholesalers & RC suppliers." },
      { k: "thane", q: "Thane + Mira-Bhayandar toy / RC car WHOLESALERS, distributors & manufacturers." },
      { k: "navimumbai", q: "Navi Mumbai — Vashi APMC market, Turbhe, Nerul, Panvel toy wholesalers & distributors (RC cars)." },
      { k: "bhiwandi", q: "Bhiwandi (Mumbai wholesale/warehousing hub) toy & RC car IMPORTERS, distributors, stockists — names." },
      { k: "ulhasnagar", q: "Ulhasnagar / Kalyan / Dombivli Mumbai toy wholesale hub — RC/toy wholesalers & manufacturers (Ulhasnagar is a known wholesale cluster)." },
      { k: "hobby", q: "Mumbai hobby-grade RC distributors / importers (Traxxas, MJX, WLtoys, ARRMA, Double Eagle) — B2B trade names + area." },
      { k: "jnpt", q: "Import-export / Zauba / Volza data: RC-car (HS 9503 / 95030030) IMPORTERS based in Mumbai / Navi Mumbai (JNPT / Nhava Sheva port)." },
      { k: "moulders", q: "Mumbai / Vasai plastic injection MOULDERS & OEM toy makers (toy-car shells, chassis) — company names + area." },
      { k: "spares", q: "Mumbai wholesale suppliers of RC car spares — motors, ESC, batteries, remotes, wheels — company names." },
      { k: "justdial", q: "Justdial / Sulekha listings: 'remote control car wholesaler Mumbai', 'toy distributor Mumbai', 'RC car dealer wholesale Mumbai' — extract the WHOLESALE/distributor business names (not retail single-shops)." },
      { k: "maps", q: "Google Maps: 'toy wholesale market Mumbai', 'remote control car wholesaler', 'toy distributor Mumbai' — extract shop/company names + area for B2B wholesalers/distributors only." },
      { k: "kids-whole", q: "IndiaMART 'kids toys wholesaler Mumbai' + 'toys wholesale dealer Mumbai' broad sweep — keep only ones that carry RC / remote-control / battery cars." },
      { k: "smitox", q: "Mumbai B2B toy wholesale marketplaces & big wholesalers (Smitox-style, bulk toy traders) carrying RC cars — company names." },
    ],
  },
  delhi: {
    city: "Delhi NCR",
    cityMatch: "delhi|new delhi|noida|ghaziabad|gurgaon|gurugram|faridabad|sadar|jhandewalan|mayapuri|karol bagh|chandni|sodala",
    queries: [
      { k: "im-whole", q: "IndiaMART remote-control car & RC toy WHOLESALERS / suppliers in DELHI — names + indiamart URL." },
      { k: "im-mfg", q: "IndiaMART remote-control / RC / battery toy car MANUFACTURERS in Delhi NCR — names + indiamart URL." },
      { k: "im-dist", q: "IndiaMART toy DISTRIBUTORS / wholesale dealers in Delhi (that carry RC cars)." },
      { k: "sadar", q: "Sadar Bazar Delhi (Teliwara, Qutab Road, Bara Tooti) toy & RC WHOLESALERS / importers — shop/company names." },
      { k: "jhandewalan", q: "Jhandewalan Cycle Market + Pratap Market + Motia Khan Delhi toy/RC wholesalers — names." },
      { k: "mayapuri", q: "Mayapuri / Naraina Delhi toy & RC wholesalers, distributors, importers." },
      { k: "karolbagh", q: "Karol Bagh / Gaffar Market Delhi RC & electronics-toy wholesalers." },
      { k: "chandni", q: "Chandni Chowk / Khari Baoli / Bhagirath Palace area Delhi toy wholesalers carrying RC cars." },
      { k: "gandhinagar", q: "Gandhi Nagar / Shahdara / Kirti Nagar Delhi toy wholesalers & manufacturers (RC / battery cars)." },
      { k: "tradeindia", q: "TradeIndia + ExportersIndia: remote control car / toy suppliers, wholesalers, manufacturers in Delhi NCR." },
      { k: "noida", q: "Noida / Greater Noida toy & RC car manufacturers, distributors, importers." },
      { k: "ghaziabad", q: "Ghaziabad + Faridabad toy / RC car manufacturers & wholesalers." },
      { k: "gurgaon", q: "Gurgaon / Gurugram RC & toy distributors / importers (B2B)." },
      { k: "im-import", q: "IndiaMART RC car IMPORTERS / exporters based in Delhi NCR." },
      { k: "im-battery", q: "IndiaMART battery-operated toy car & ride-on suppliers/manufacturers Delhi NCR." },
      { k: "hobby", q: "Delhi hobby-grade RC distributors / importers (Traxxas, MJX, WLtoys, HPI, ARRMA) — B2B trade names + area." },
      { k: "icd", q: "Import-export / Zauba / Volza data: RC-car (HS 9503) IMPORTERS based in Delhi NCR (ICD Tughlakabad / Patparganj)." },
      { k: "moulders", q: "Delhi NCR plastic injection MOULDERS & OEM toy makers (toy-car shells/chassis) — names + area." },
      { k: "spares", q: "Delhi wholesale suppliers of RC car spares — motors, ESC, batteries, remotes, wheels — company names." },
      { k: "justdial", q: "Justdial / Sulekha: 'remote control car wholesaler Delhi', 'toy distributor Delhi', 'RC car dealer wholesale Delhi' — extract WHOLESALE/distributor names (not retail)." },
      { k: "maps", q: "Google Maps: 'toy wholesale market Delhi', 'remote control car wholesaler Sadar Bazar', 'toy distributor Delhi' — extract B2B wholesaler/distributor names + area." },
      { k: "kids-whole", q: "IndiaMART 'kids toys wholesaler Delhi' + 'toys wholesale dealer Delhi' broad sweep — keep only RC/remote-control/battery-car carriers." },
      { k: "tilaknagar", q: "Tilak Nagar / Janakpuri / Rajouri Garden / Uttam Nagar Delhi toy wholesalers & distributors (RC cars)." },
      { k: "okhla", q: "Okhla / Mohan Estate / Jasola Delhi RC & toy importers/distributors (B2B)." },
      { k: "wazirpur", q: "Wazirpur / Lawrence Road / Azadpur Delhi toy & plastic-toy manufacturers/wholesalers." },
      { k: "b2b-bulk", q: "Delhi big B2B toy wholesale traders / stockists (bulk, MOQ) carrying RC / remote-control cars — company names." },
    ],
  },
};

(async () => {
  const cityKey = (process.argv[2] || "mumbai").toLowerCase();
  const cfg = CITY_QUERIES[cityKey];
  if (!cfg) { console.error("unknown city", cityKey); process.exit(1); }

  const existing = (await db.vendor.findMany({ select: { name: true } })).map((v) => v.name);

  const src = `export const meta = {
  name: 'find-${cityKey}-suppliers',
  description: 'Deep ${cfg.city} sweep for NEW distributor/wholesaler/manufacturer RC suppliers (no retailers), deduped',
  phases: [{ title: 'Discover', detail: '${cfg.queries.length} parallel ${cfg.city} market/area strategies' }],
}

const EXISTING = ${JSON.stringify(existing)};
const norm = (s) => (s || "").toLowerCase().replace(/\\([^)]*\\)/g, " ").replace(/[^a-z0-9]+/g, "")
const existingKeys = EXISTING.map((n) => norm(n)).filter((k) => k.length >= 4)
function isKnown(name) { const k = norm(name); if (k.length < 4) return true; const head = k.slice(0, 14); return existingKeys.some((e) => e.includes(head) || k.includes(e.slice(0, 14))) }

const CONTEXT = \`We are "Pocket RC Cars", an India D2C brand sourcing remote-control / radio-control cars (drift, stunt, 1:10-1:64, battery-operated toy cars, hobby-grade RC) at WHOLESALE. RIGHT NOW we are building our ${cfg.city} supplier base ONLY.
We need ${cfg.city}-based SUPPLY-SIDE vendors: DISTRIBUTOR, WHOLESALER, MANUFACTURER, IMPORTER, OEM, MOULDER, or bulk TRADER — businesses we can BUY from in bulk.
HARD EXCLUSIONS: retailers, single-shop consumer toy stores, hobby storefronts, e-commerce/marketplace sellers, die-cast collector shops, anyone selling only single units to consumers. Also exclude vendors NOT located in ${cfg.city} / its metro region.
QUALITY BAR: only include a vendor with a real B2B signal (IndiaMART/TradeIndia supplier page, company website, "manufacturer/wholesaler/distributor/importer" designation, GST/CIN, import records, bulk/MOQ). NEVER invent a vendor or phone. The 'signal' must cite the source + the B2B + ${cfg.city}-location evidence.\`

const ITEM = { type:'object', additionalProperties:false, properties:{ name:{type:'string'}, type:{type:'string', enum:['MANUFACTURER','DISTRIBUTOR','WHOLESALER','IMPORTER','OEM','MOULDER','TRADER']}, city:{type:'string'}, area:{type:'string'}, phone:{type:'string'}, website:{type:'string'}, indiamartUrl:{type:'string'}, signal:{type:'string'}, isRetailer:{type:'boolean'} }, required:['name','type','city','signal','isRetailer'] }
const BATCH = { type:'object', additionalProperties:false, properties:{ vendors:{ type:'array', items: ITEM } }, required:['vendors'] }

const QUERIES = ${JSON.stringify(cfg.queries)};

phase('Discover')
log(\`\${QUERIES.length} ${cfg.city} strategies…\`)
const results = await parallel(QUERIES.map((Q) => () =>
  agent(
    \`\${CONTEXT}\\n\\nYOUR EXTRACTION TASK: \${Q.q}\\n\\nUse WebSearch + WebFetch aggressively (multiple searches; open supplier listing pages & company sites). Return EVERY qualifying NEW ${cfg.city} supplier you can verify — aim for 15-30 distributors/wholesalers/manufacturers. Fill name, type, city, area, phone/website/indiamartUrl if truly found, a 'signal' citing source + B2B + ${cfg.city} location, isRetailer (true only if actually a retailer — dropped). NO retailers, NO out-of-${cfg.city} vendors, NO invented data.\\n\\nAlready in our system (skip): \${EXISTING.slice(0,90).join(', ')} … (and more).\`,
    { schema: BATCH, label: 'find:'+Q.k, phase: 'Discover', agentType: 'general-purpose' },
  )
))

const seen = new Set(); const out = []; let raw=0; const drops={retailer:0,known:0,dupe:0,nosignal:0,outcity:0}
const inCity = (s) => new RegExp('${cfg.cityMatch}','i').test(s||'')
for (let i=0;i<results.length;i++){ const r=results[i]; if(!r||!Array.isArray(r.vendors)) continue
  for (const v of r.vendors){ raw++
    if(!v.name||!v.name.trim()) continue
    if(v.isRetailer===true){ drops.retailer++; continue }
    if(!v.signal||v.signal.trim().length<8){ drops.nosignal++; continue }
    if(!inCity(v.city)&&!inCity(v.area)&&!inCity(v.signal)){ drops.outcity++; continue }
    if(isKnown(v.name)){ drops.known++; continue }
    const key=norm(v.name).slice(0,16); if(!key||seen.has(key)){ drops.dupe++; continue }
    seen.add(key)
    out.push({ name:v.name.trim(), type:v.type||'WHOLESALER', city:(v.city||'').trim(), state:'Maharashtra/Delhi', area:(v.area||'').trim(), phone:(v.phone||'').trim(), website:(v.website||'').trim(), indiamartUrl:(v.indiamartUrl||'').trim(), signal:v.signal.trim().slice(0,280), source:'${cityKey}-'+QUERIES[i].k })
  }
}
const byType={}; for(const v of out) byType[v.type]=(byType[v.type]||0)+1
log(\`Raw \${raw} → \${out.length} new \${'${cfg.city}'} suppliers (dropped \${drops.known} known, \${drops.dupe} dup, \${drops.retailer} retail, \${drops.outcity} out-of-city)\`)
return { city:'${cfg.city}', newCount: out.length, raw, drops, byType, vendors: out }
`;

  const out = `/Users/syedibrahim/Desktop/bch-sourcing-os/scripts/_find_${cityKey}.js`;
  writeFileSync(out, src, "utf8");
  console.log("WROTE", out, "·", cfg.queries.length, "queries ·", existing.length, "existing names ·", src.length, "bytes");
})().finally(() => db.$disconnect());
