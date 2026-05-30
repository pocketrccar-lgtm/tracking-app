/**
 * Import vendors from SHOAIB_MASTER_CALL_LIST.md into the DB.
 *
 * Path is hard-coded to /Users/syedibrahim/Desktop/SOURCING_HQ/RC_RESEARCH/SHOAIB_MASTER_CALL_LIST.md
 * but can be overridden via MD_PATH env var.
 *
 * Run:  npm run db:import-vendors   (after npm run db:migrate + npm run db:seed)
 */
import { PrismaClient } from "../src/generated/prisma";
import { readFileSync } from "fs";

const db = new PrismaClient();

const DEFAULT_MD = "/Users/syedibrahim/Desktop/SOURCING_HQ/RC_RESEARCH/SHOAIB_MASTER_CALL_LIST.md";
const MD_PATH = process.env.MD_PATH || DEFAULT_MD;

type ParsedPhone = { phone: string; label?: string };
type ParsedEmail = { email: string; label?: string };

type ParsedVendor = {
  name: string;
  type: string;
  tier: string;
  driftStatus: string;
  bchRelevance: number;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  gst?: string | null;
  cin?: string | null;
  founderName?: string | null;
  founderLinkedin?: string | null;
  founderTitle?: string | null;
  websiteUrl?: string | null;
  igHandle?: string | null;
  notes?: string | null;
  sourceMd: string;
  sourceUrl?: string | null;
  phones: ParsedPhone[];
  emails: ParsedEmail[];
};

// ─── helpers ───────────────────────────────────────────────────────────────

const PHONE_RE = /(\+91[\s\-]?\d{4,5}[\s\-]?\d{4,5})|(\b\d{10}\b)/g;
const EMAIL_RE = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
const GST_RE = /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z0-9]Z[A-Z0-9]\b/g;
const CIN_RE = /\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g;
const URL_RE = /https?:\/\/[^\s)]+/g;
const IG_RE = /(?:@|instagram\.com\/)([a-zA-Z0-9._]+)/i;
const LINKEDIN_RE = /linkedin\.com\/(?:in|company)\/[A-Za-z0-9_\-]+/i;

function extractPhones(text: string): ParsedPhone[] {
  const out: ParsedPhone[] = [];
  const seen = new Set<string>();
  const matches = text.match(PHONE_RE) ?? [];
  for (const raw of matches) {
    const clean = raw.replace(/[\s\-]+/g, "");
    if (clean.length < 10) continue;
    // Normalize to +91-XXXXX-XXXXX format
    let normalized = clean;
    if (!normalized.startsWith("+91")) normalized = "+91" + normalized;
    const digits = normalized.replace(/^\+91/, "");
    if (digits.length !== 10) continue;
    const formatted = `+91-${digits.slice(0, 5)}-${digits.slice(5)}`;
    if (seen.has(formatted)) continue;
    seen.add(formatted);
    // Try to infer label from surrounding context
    const idx = text.indexOf(raw);
    const ctx = text.slice(Math.max(0, idx - 30), idx).toLowerCase();
    let label: string | undefined;
    if (/wholesale/.test(ctx)) label = "wholesale";
    else if (/retail/.test(ctx)) label = "retail";
    else if (/whatsapp|wa\b/.test(ctx)) label = "whatsapp";
    else if (/founder|owner|director|cmd|ceo/.test(ctx)) label = "founder";
    else label = "main";
    out.push({ phone: formatted, label });
  }
  return out;
}

function extractEmails(text: string): ParsedEmail[] {
  const matches = text.match(EMAIL_RE) ?? [];
  return Array.from(new Set(matches)).map((e) => ({ email: e }));
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[0] : null;
}

function extractFromBlock(block: string, defaults: Partial<ParsedVendor>): ParsedVendor | null {
  // Get the heading line (e.g. "### 1.5 — CTM Toys / Toyboi brand (Mumbai, Maharashtra)")
  const headingMatch = block.match(/^###\s+([\d.]+)\s*[—\-–]\s*(.+?)$/m);
  if (!headingMatch) return null;
  const rawTitle = headingMatch[2].trim();

  // Strip out parenthetical (City, State) and trailing ★ markers
  const cityStateMatch = rawTitle.match(/\(([^)]+)\)/);
  let location: string | null = null;
  if (cityStateMatch) location = cityStateMatch[1];
  const name = rawTitle
    .replace(/\([^)]+\)/, "")
    .replace(/★\s*\S+\s*$/, "")
    .replace(/[★⭐]+/g, "")
    .trim();

  let city: string | null = null;
  let state: string | null = null;
  if (location) {
    const parts = location.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      city = parts[0];
      state = parts[1];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  }

  const phones = extractPhones(block);
  const emails = extractEmails(block);
  const gst = firstMatch(block, GST_RE);
  const cin = firstMatch(block, CIN_RE);
  const urls = block.match(URL_RE) ?? [];
  const websiteUrl = urls.find((u) => !u.includes("linkedin.com") && !u.includes("instagram.com")) ?? null;
  const linkedinMatch = block.match(LINKEDIN_RE);
  const founderLinkedin = linkedinMatch ? linkedinMatch[0] : null;
  const igMatch = block.match(IG_RE);
  const igHandle = igMatch && !igMatch[1].includes(".com") ? igMatch[1] : null;

  // Try to extract notes from "Why:" / "Verdict:" / "Notes:" lines
  const notesParts: string[] = [];
  for (const re of [/\*\*Why:\*\*\s*(.+)/i, /\*\*Verdict:\*\*\s*(.+)/i, /\*\*Specific ask:?\*\*\s*([\s\S]+?)(?=\n\*\*|\n###|\n---)/i]) {
    const m = block.match(re);
    if (m) notesParts.push(m[1].trim());
  }
  const notes = notesParts.length ? notesParts.join("\n\n") : null;

  if (phones.length === 0 && emails.length === 0 && !websiteUrl && !founderLinkedin) {
    return null; // not actionable
  }

  return {
    name,
    type: defaults.type ?? "WHOLESALER",
    tier: defaults.tier ?? "T3_VERIFY_DRIFT",
    driftStatus: defaults.driftStatus ?? "UNKNOWN",
    bchRelevance: defaults.bchRelevance ?? 5,
    state,
    city,
    address: null,
    gst,
    cin,
    founderName: null,
    founderLinkedin,
    founderTitle: null,
    websiteUrl,
    igHandle,
    notes,
    sourceMd: "SHOAIB_MASTER_CALL_LIST.md",
    sourceUrl: null,
    phones,
    emails,
  };
}

// ─── tier 3/4 table parser ─────────────────────────────────────────────────

function parseTierTable(tableMd: string, tier: string, driftStatus: string, defaultRel: number): ParsedVendor[] {
  const lines = tableMd.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return [];
  // Skip header + separator rows
  const dataRows = lines.slice(2);
  const out: ParsedVendor[] = [];
  for (const row of dataRows) {
    const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 7) continue;
    // Format for Tier 3: # | Vendor | State | City | Phone | Type | Product | Source | Status
    // (some rows might be slightly different)
    const [, vendor, stateCol, cityCol, phoneCol, typeCol, productCol, sourceCol] = cells;
    if (!vendor || !vendor.replace(/[\s|]/g, "")) continue;

    const phones = extractPhones(phoneCol);
    if (phones.length === 0 && !sourceCol?.includes("indiamart")) continue;

    const typeMap: Record<string, string> = {
      MFG: "MANUFACTURER",
      DIST: "DISTRIBUTOR",
      WHOLE: "WHOLESALER",
      WHOLESALER: "WHOLESALER",
      TRADER: "TRADER",
      IMP: "IMPORTER",
      IMPORTER: "IMPORTER",
      OEM: "OEM",
    };
    const type = typeMap[typeCol.toUpperCase()] || "WHOLESALER";

    out.push({
      name: vendor.replace(/\*\*/g, "").trim(),
      type,
      tier,
      driftStatus,
      bchRelevance: defaultRel,
      state: stateExpand(stateCol),
      city: cityCol || null,
      address: null,
      gst: null,
      cin: null,
      founderName: null,
      founderLinkedin: null,
      founderTitle: null,
      websiteUrl: null,
      igHandle: null,
      notes: productCol || null,
      sourceMd: "SHOAIB_MASTER_CALL_LIST.md",
      sourceUrl: sourceCol?.includes("indiamart") ? sourceCol : null,
      phones,
      emails: [],
    });
  }
  return out;
}

function stateExpand(abbr: string): string | null {
  const map: Record<string, string> = {
    MH: "Maharashtra",
    DL: "Delhi",
    GJ: "Gujarat",
    KA: "Karnataka",
    TN: "Tamil Nadu",
    TG: "Telangana",
    AP: "Andhra Pradesh",
    KL: "Kerala",
    UP: "Uttar Pradesh",
    RJ: "Rajasthan",
    WB: "West Bengal",
    MP: "Madhya Pradesh",
    HR: "Haryana",
    PB: "Punjab",
    UK: "Uttarakhand",
  };
  const clean = abbr.replace(/[\s|]/g, "").toUpperCase();
  return map[clean] ?? abbr.trim() ?? null;
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading: ${MD_PATH}`);
  const md = readFileSync(MD_PATH, "utf-8");

  const allVendors: ParsedVendor[] = [];

  // TIER 1 + TIER 2: split by "### N.M — Name" headings
  const tier1Section = md.match(/## 🔥 TIER 1[\s\S]+?(?=## 🟡 TIER 2|## 🟢 TIER 3|---\s*\n## )/);
  const tier2Section = md.match(/## 🟡 TIER 2[\s\S]+?(?=## 🟢 TIER 3|---\s*\n## )/);

  for (const [section, tier, drift, defaultRel] of [
    [tier1Section, "T1_DRIFT_CONFIRMED", "YES_CONFIRMED", 9],
    [tier2Section, "T2_STRONG_SIGNAL", "LIKELY", 7],
  ] as const) {
    if (!section) continue;
    const blocks = section[0].split(/(?=^###\s+\d+\.\d+\s)/m);
    for (const block of blocks) {
      const v = extractFromBlock(block, {
        tier,
        driftStatus: drift,
        bchRelevance: defaultRel,
      });
      if (v) allVendors.push(v);
    }
  }

  // TIER 3: compact table
  const tier3Match = md.match(/## 🟢 TIER 3[\s\S]+?(?=## 🔵 TIER 4|---\s*\n## )/);
  if (tier3Match) {
    allVendors.push(...parseTierTable(tier3Match[0], "T3_VERIFY_DRIFT", "UNKNOWN", 5));
  }

  // TIER 4: IndiaMART URL only table
  const tier4Match = md.match(/## 🔵 TIER 4[\s\S]+?(?=## 🌏|---\s*\n## )/);
  if (tier4Match) {
    allVendors.push(...parseTierTable(tier4Match[0], "T4_INDIAMART_GATED", "UNKNOWN", 4));
  }

  console.log(`Parsed ${allVendors.length} vendors. Upserting...`);

  let inserted = 0;
  let updated = 0;
  let phoneCount = 0;
  let emailCount = 0;

  for (const v of allVendors) {
    try {
      const existing = await db.vendor.findFirst({
        where: { name: v.name },
      });
      if (existing) {
        await db.vendor.update({
          where: { id: existing.id },
          data: {
            type: v.type,
            tier: v.tier,
            driftStatus: v.driftStatus,
            bchRelevance: v.bchRelevance,
            state: v.state,
            city: v.city,
            gst: v.gst,
            cin: v.cin,
            founderLinkedin: v.founderLinkedin,
            websiteUrl: v.websiteUrl,
            igHandle: v.igHandle,
            notes: v.notes,
            sourceMd: v.sourceMd,
            sourceUrl: v.sourceUrl,
          },
        });
        updated++;
      } else {
        await db.vendor.create({
          data: {
            name: v.name,
            type: v.type,
            tier: v.tier,
            driftStatus: v.driftStatus,
            bchRelevance: v.bchRelevance,
            state: v.state,
            city: v.city,
            gst: v.gst,
            cin: v.cin,
            founderLinkedin: v.founderLinkedin,
            websiteUrl: v.websiteUrl,
            igHandle: v.igHandle,
            notes: v.notes,
            sourceMd: v.sourceMd,
            sourceUrl: v.sourceUrl,
            phones: { create: v.phones },
            emails: { create: v.emails },
          },
        });
        inserted++;
        phoneCount += v.phones.length;
        emailCount += v.emails.length;
      }
    } catch (e) {
      console.error(`WARN: failed to upsert ${v.name}:`, (e as Error).message);
    }
  }

  console.log(`\n✓ Done.`);
  console.log(`  Inserted: ${inserted} vendors (+${phoneCount} phones, +${emailCount} emails)`);
  console.log(`  Updated:  ${updated} vendors`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
