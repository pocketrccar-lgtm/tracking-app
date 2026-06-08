// Generates a YouTube-mining workflow: agents use the YouTube Data API to find
// RC/toy wholesale-market vlogs + factory tours and extract vendor names +
// contacts from titles/descriptions/comments. No retailers.
import { writeFileSync, readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

(async () => {
  const keys = JSON.parse(readFileSync("/Users/syedibrahim/Desktop/SOURCING_HQ/scripts/keys.json", "utf8"));
  const ytRaw = Array.isArray(keys.youtube) ? keys.youtube[0] : keys.youtube;
  const YT = typeof ytRaw === "string" ? ytRaw : ytRaw?.key || ytRaw?.token;
  if (!YT) throw new Error("no youtube key");

  const existing = (await db.vendor.findMany({ select: { name: true } })).map((v) => v.name);

  const QUERIES = [
    "RC car wholesale market India",
    "remote control car cheapest wholesale market",
    "toy wholesale market India vlog",
    "toy factory manufacturer India tour",
    "Sadar Bazar toy wholesale market Delhi",
    "Crawford Market toys Mumbai wholesale",
    "Sowcarpet toy wholesale market Chennai",
    "remote control car importer India",
    "drift RC car India buy wholesale price",
    "RC car shop wholesale price India",
    "battery operated car toy manufacturer India",
    "China toy market RC car wholesale import",
    "remote control car wholesale business India",
    "toy distributor wholesaler India",
    "hobby grade RC car India dealer distributor",
    "remote control car manufacturer factory India",
  ];

  const src = `export const meta = {
  name: 'find-youtube-suppliers',
  description: 'Mine YouTube RC/toy market vlogs + factory tours for NEW manufacturer/wholesaler/trader vendors (no retailers)',
  phases: [{ title: 'Mine', detail: '${QUERIES.length} YouTube search angles via the Data API' }],
}

const YT = ${JSON.stringify(YT)};
const EXISTING = ${JSON.stringify(existing)};
const norm = (s) => (s || "").toLowerCase().replace(/\\([^)]*\\)/g, " ").replace(/[^a-z0-9]+/g, "")
const existingKeys = EXISTING.map((n) => norm(n)).filter((k) => k.length >= 4)
function isKnown(name){ const k=norm(name); if(k.length<4) return true; const head=k.slice(0,14); return existingKeys.some((e)=>e.includes(head)||k.includes(e.slice(0,14))) }

const ITEM = { type:'object', additionalProperties:false, properties:{ name:{type:'string'}, type:{type:'string', enum:['MANUFACTURER','DISTRIBUTOR','WHOLESALER','IMPORTER','OEM','MOULDER','TRADER']}, city:{type:'string'}, phone:{type:'string'}, signal:{type:'string'}, video:{type:'string'}, isRetailer:{type:'boolean'} }, required:['name','type','signal','isRetailer'] }
const BATCH = { type:'object', additionalProperties:false, properties:{ vendors:{ type:'array', items: ITEM } }, required:['vendors'] }

const QUERIES = ${JSON.stringify(QUERIES)};

const PROMPT = (q) => \`You mine YouTube for SUPPLY-SIDE RC/toy vendors for the brand "Pocket RC Cars". Goal: the most MANUFACTURERS, WHOLESALERS, TRADERS, distributors, importers, OEMs, moulders — businesses we can buy from in bulk. SKIP retailers / single consumer shops / e-commerce sellers.

Use the YouTube Data API (key already provided) via Bash + curl. Run these steps for the search angle: "\${q}"

1) SEARCH (find market vlogs / factory tours / wholesale hauls):
   curl -s "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&relevanceLanguage=en&q=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "\${q}")&key=${'${YT}'}"
   -> collect up to 20 videoIds + titles + channelTitles.
2) DESCRIPTIONS (the gold — vloggers list shop names, phones, addresses here):
   curl -s "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=<comma,separated,ids>&key=${'${YT}'}"
   -> read snippet.description of each. Extract any SHOP/COMPANY/MANUFACTURER/WHOLESALER names + phone numbers + city/market they mention.
3) COMMENTS (often "where did you buy?" answers with shop names/numbers):
   curl -s "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=<id>&maxResults=40&order=relevance&key=${'${YT}'}"
   -> for the 3-5 most relevant videos. Extract vendor names/phones mentioned.
If the API returns a quota/403 error, fall back to WebSearch for the YouTube videos and WebFetch the watch pages + use the vidiq video_transcript / video_comments MCP tools if available.

For EVERY qualifying NEW vendor found (a real supplier named in a video/description/comment, NOT a retailer): return name, type, city (if stated), phone (if a real number is shown — never invent), a 'signal' = what was found + which video/source, and the 'video' title/id. Aim for as many as the videos genuinely yield (10-30). Do not invent vendors or numbers.

Already in our system (skip): \${EXISTING.slice(0,90).join(', ')} … (and more).\`

phase('Mine')
log(\`\${QUERIES.length} YouTube angles\`)
const results = await parallel(QUERIES.map((q,i) => () =>
  agent(PROMPT(q), { schema: BATCH, label: 'yt:'+(i+1), phase: 'Mine', agentType: 'general-purpose' })
))

const seen=new Set(); const out=[]; let raw=0; const drops={retailer:0,known:0,dupe:0,nosignal:0}
for (let i=0;i<results.length;i++){ const r=results[i]; if(!r||!Array.isArray(r.vendors)) continue
  for (const v of r.vendors){ raw++
    if(!v.name||!v.name.trim()) continue
    if(v.isRetailer===true){ drops.retailer++; continue }
    if(!v.signal||v.signal.trim().length<8){ drops.nosignal++; continue }
    if(isKnown(v.name)){ drops.known++; continue }
    const key=norm(v.name).slice(0,16); if(!key||seen.has(key)){ drops.dupe++; continue }
    seen.add(key)
    out.push({ name:v.name.trim(), type:v.type||'TRADER', city:(v.city||'').trim(), phone:(v.phone||'').trim(), website:'', indiamartUrl:'', signal:(v.signal||'').trim().slice(0,280), source:'youtube-'+(i+1) })
  }
}
const byType={}; for(const v of out) byType[v.type]=(byType[v.type]||0)+1
log(\`Raw \${raw} → \${out.length} new from YouTube (dropped \${drops.known} known, \${drops.dupe} dup, \${drops.retailer} retail)\`)
return { newCount: out.length, raw, drops, byType, vendors: out }
`;

  const out = "/Users/syedibrahim/Desktop/bch-sourcing-os/scripts/_find_youtube.js";
  writeFileSync(out, src, "utf8");
  console.log("WROTE", out, "·", QUERIES.length, "angles ·", existing.length, "existing ·", src.length, "bytes");
})().finally(() => db.$disconnect());
