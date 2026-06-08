// Classify any unscored vendors from their notes, then GLOBALLY re-rank all by
// business volume (gate = GREY/ABOVE_GREY & accept>=40). Prints the biggest per city.
import { PrismaClient } from "../src/generated/prisma";
const db = new PrismaClient();
const clamp = (n: number, lo = 35, hi = 95) => Math.max(lo, Math.min(hi, Math.round(n)));

function turnoverCr(n: string): number | null {
  const cr = n.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*Cr/i); if (cr) return parseFloat(cr[2]);
  const lc = n.match(/(\d+)\s*L\s*-\s*(\d+(?:\.\d+)?)\s*Cr/i); if (lc) return parseFloat(lc[2]);
  const l = n.match(/(\d+)\s*-\s*(\d+)\s*L\b/i); if (l) return parseFloat(l[2]) / 100;
  return null;
}
function emp(n: string): number {
  const m = n.match(/(\d+)\s*-\s*(\d+)\s*(?:people|employees|empl)/i); if (m) return parseInt(m[2], 10);
  if (/101-500|501-1000|Above 1000/i.test(n)) return 300;
  if (/51-100/.test(n)) return 75; if (/26-50/.test(n)) return 40; if (/11-25/.test(n)) return 18; return 0;
}
type V = { id: string; name: string; type: string; city: string | null; notes: string | null; marketLevel: string | null; volumeScore: number | null; acceptScore: number | null };

function classify(v: V) {
  const n = v.notes ?? "", t = v.type;
  const formal = /\b(private limited|pvt\.?\s*ltd|limited company|\bltd\b)\b/i.test(n);
  const partnership = /partnership/i.test(n), prop = /(proprietor|proprietorship)/i.test(n);
  const gst = /\bGST\b/i.test(n) || /verified/i.test(n), iec = /\bIEC\b|import-export code|TrustSEAL/i.test(n);
  const cr = turnoverCr(n), e = emp(n);
  let vol = cr == null ? 44 : cr >= 25 ? 85 : cr >= 10 ? 78 : cr >= 5 ? 70 : cr >= 1.5 ? 60 : cr >= 0.4 ? 50 : 44;
  if (t === "MANUFACTURER" || t === "OEM" || t === "MOULDER") vol += 4; if (t === "IMPORTER") vol += 2;
  if (formal) vol += 6; else if (partnership) vol += 2;
  if (e >= 100) vol += 8; else if (e >= 50) vol += 5; else if (e >= 25) vol += 3; if (iec) vol += 2;
  vol = clamp(vol, 35, 92);
  const aboveGrey = formal || (cr != null && cr >= 5) || ((t === "MANUFACTURER" || t === "OEM" || t === "MOULDER") && (gst || iec)) || iec;
  let acc = 64; if (prop || t === "WHOLESALER" || t === "TRADER") acc += 10;
  if (/get best quote|response|enquir|whatsapp|catalog/i.test(n)) acc += 5; if (t === "IMPORTER") acc += 4;
  if ((cr != null && cr >= 25) || e >= 100) acc -= 10; acc = clamp(acc, 40, 90);
  const bits: string[] = [formal ? "Registered Ltd/Pvt" : partnership ? "Partnership" : prop ? "Proprietorship" : t.toLowerCase()];
  if (cr != null) bits.push(cr >= 1 ? `₹${cr}Cr+` : `₹${Math.round(cr * 100)}L`);
  if (gst) bits.push("GST"); if (iec) bits.push("IEC/export"); if (e >= 25) bits.push(`${e}+ staff`);
  return { marketLevel: aboveGrey ? "ABOVE_GREY" : "GREY", volumeScore: vol, acceptScore: acc, reason: bits.join(" · ") };
}

const inCity = (c: string | null, re: RegExp) => re.test(c || "");

async function main() {
  const all = (await db.vendor.findMany({ select: { id: true, name: true, type: true, city: true, notes: true, marketLevel: true, volumeScore: true, acceptScore: true } })) as V[];
  let classified = 0;
  const scored = all.map((v) => {
    if (v.marketLevel == null) { const c = classify(v); classified++; return { ...v, ...c, reason: c.reason as string | null }; }
    return { ...v, reason: null as string | null };
  });
  for (const v of scored) if (v.reason != null) await db.vendor.update({ where: { id: v.id }, data: { marketLevel: v.marketLevel, volumeScore: v.volumeScore, acceptScore: v.acceptScore, rankReason: v.reason } });

  const gated = scored.filter((v) => (v.marketLevel === "GREY" || v.marketLevel === "ABOVE_GREY") && (v.acceptScore ?? 0) >= 40);
  gated.sort((a, b) => (b.volumeScore ?? 0) - (a.volumeScore ?? 0) || (b.acceptScore ?? 0) - (a.acceptScore ?? 0) || a.name.localeCompare(b.name));
  const rankById = new Map(gated.map((v, i) => [v.id, i + 1]));
  for (const v of scored) await db.vendor.update({ where: { id: v.id }, data: { rank: rankById.get(v.id) ?? null } });

  console.log(`Classified ${classified}. Ranked ${gated.length} of ${all.length}.`);
  const MUM = /mumbai|thane|bhiwandi|navi|vasai|virar|kalyan|dombivli|ulhasnagar|panvel|mira|bhayandar|ambarnath|mumbra/i;
  const DEL = /delhi|noida|ghaziabad|gurgaon|gurugram|faridabad/i;
  for (const [label, re] of [["MUMBAI", MUM], ["DELHI", DEL]] as const) {
    const top = gated.filter((v) => inCity(v.city, re)).slice(0, 15);
    console.log(`\nTOP ${label} (biggest, ranked):`);
    top.forEach((v) => console.log(`  #${rankById.get(v.id)}  vol ${v.volumeScore}  ${v.name.slice(0, 46)} [${v.type}] ${v.city ?? ""}`));
  }
}
main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
