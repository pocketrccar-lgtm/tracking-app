/**
 * Idempotent seed: equal partners + categories + playbooks + known socials.
 * Run with: npx prisma db seed   (or  npm run db:seed)
 */
import { PrismaClient } from "../src/generated/prisma";
import { DEFAULT_CATEGORIES } from "../src/lib/enums";

const db = new PrismaClient();

// Brand socials we are confident about from the research.
const SOCIALS: {
  match: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  indiamartUrl?: string;
}[] = [
  { match: "Daddy Drones", instagramUrl: "https://instagram.com/daddydronesmumbai", youtubeUrl: "https://youtube.com/@daddydrones", websiteUrl: "https://daddydrones.in" },
  { match: "WLtoys", instagramUrl: "https://instagram.com/wltoysofficial", websiteUrl: "https://wl-xks.com" },
  { match: "Mirana", instagramUrl: "https://instagram.com/mirana.toys", websiteUrl: "https://miranatoys.com" },
  { match: "DeoDap", instagramUrl: "https://instagram.com/deodap", websiteUrl: "https://deodap.in", indiamartUrl: "https://www.indiamart.com/deodap/" },
  { match: "Tygatec", websiteUrl: "https://tygatec.com" },
  { match: "Legend of Toys", instagramUrl: "https://instagram.com/legendoftoys", websiteUrl: "https://legendoftoys.com" },
  { match: "Toyzone", websiteUrl: "https://toyzone.in" },
  { match: "Bharat Hobby", instagramUrl: "https://instagram.com/bharat_hobby", websiteUrl: "https://bharathobby.com" },
  { match: "Hobby Central", instagramUrl: "https://instagram.com/hobby_central_", websiteUrl: "https://hobbycentral.co.in" },
  { match: "RC Trendsetters", websiteUrl: "https://rctrendsetters.com" },
  { match: "KV Toys", websiteUrl: "https://kvtoys.com" },
  { match: "Hemani Exim", websiteUrl: "https://kyoshoindia.com" },
  { match: "Kyosho India", websiteUrl: "https://kyoshoindia.com" },
  { match: "Fun Nation", websiteUrl: "https://funnation.in" },
];

const PLAYBOOKS = [
  {
    title: "Apify · Google Maps vendor scan",
    kind: "MAPS",
    order: 1,
    content: `**Goal:** find verified shops (phone + rating + address) per city — replaces broken IndiaMART search.

**Script:** scripts/apify_maps_scraper.py (Apify actor compass~crawler-google-places)
**Queries per city:** "<category> wholesale <city>", "<category> manufacturer <city>", "<category> importer <city>", market-area names (e.g. Sadar Bazar, Crawford Market, Sheriff Devji St).
**Key pool:** 12 Apify keys (rotate on 402/429). Budget refreshes monthly.
**Output:** maps_results.json → maps_analyze.py scores RC-relevance (STRONG/MEDIUM/GENERIC).
**Tip:** verify every phone on Maps before calling. Lead with rating × review-count for ranking.`,
  },
  {
    title: "YouTube Data API + Gemini vision scan",
    kind: "YOUTUBE",
    order: 2,
    content: `**Goal:** find vendors filmed in market-tour vlogs + classify what they actually sell.

**Scripts:** scripts/yt_rc_pipeline.py (discovery + yt-dlp frame extraction) → scripts/gemini_classify_supply_side.py (vision grade).
**Flow:** YouTube search (4–20 queries) → channels → top videos → extract 5 frames each (ffmpeg) → Gemini reads frames → vendor_type / grade / shop signage OCR.
**YouTube key:** keys.json youtube[0]. Daily quota 10k units; a search = 100 units.
**Gemini key:** keys.json gemini[0]. Retries + model fallback (2.5-flash → 2.0).
**Win:** Gemini OCRs shop signage → surfaces names/phones not in any text feed.`,
  },
  {
    title: "Gemini supply-side classifier prompt",
    kind: "GEMINI",
    order: 3,
    content: `**Goal:** keep only MANUFACTURER / DISTRIBUTOR / WHOLESALER / TRADER / IMPORTER — drop retail/hobbyist/reviewer.

**Prompt asks for:** vendor_type, supply_side bool, production_signals[] (factory floor, assembly line, warehouse pallets, MOQ board), scale_visible, estimated_inventory_pieces_visible, shop_or_facility_signage_text (OCR), skip_if_retailer.
**Output:** gemini_supply_verdicts.json. Filter supply_side=true.`,
  },
  {
    title: "Zauba / Volza importer funnel",
    kind: "ZAUBA",
    order: 4,
    content: `**Goal:** rank importers by real container volume (HS code 95030030 for RC toys).

**Sources:** zauba.com (403 to bots — open in a real browser), zaubacorp.com (CIN/directors), Volza/ImportGenius snippets.
**What it gives:** who imports the most (e.g. Taiba Technoplast 42%, Itoyy Kiing 23%, Fantom Toy 12%), their city/state/port, and the Chinese factories feeding them (Shantou Maxwinning, Yiwu Ying Hong).
**Use:** triangulate the factory upstream, then DM on Alibaba to match landed cost.`,
  },
  {
    title: "IndiaMART breadth scan (use carefully)",
    kind: "OTHER",
    order: 5,
    content: `**Goal:** enumerate possible vendors + price-band hints fast.

**Caveat:** IndiaMART search relevance collapses for niche queries (returned t-shirts for "drift rc car"). Use as breadth only; verify every contact on Google Maps / Instagram before trusting it.
**Better targeted:** indiamart.com/<seller-slug>/ direct seller pages when you already have a name.`,
  },
];

async function main() {
  console.log("Seeding equal partners…");
  // Both are equal partners / admins — neither is subordinate.
  await db.user.upsert({
    where: { email: "syed@pokketrccar.com" },
    update: { name: "Syed Ibrahim", role: "partner" },
    create: { email: "syed@pokketrccar.com", name: "Syed Ibrahim", role: "partner" },
  });
  await db.user.upsert({
    where: { email: "shoaib@pokketrccar.com" },
    update: { name: "Shoaib", role: "partner" },
    create: { email: "shoaib@pokketrccar.com", name: "Shoaib", role: "partner" },
  });
  // migrate any older seed users to equal role
  await db.user.updateMany({ data: { role: "partner" } });

  console.log("Seeding categories…");
  // Primary vertical
  const rcCars = await db.category.upsert({
    where: { slug: "rc-cars" },
    update: { name: "RC Cars", color: "red", order: 0 },
    create: { name: "RC Cars", slug: "rc-cars", color: "red", order: 0, description: "Remote-control cars — the launch vertical" },
  });
  for (const c of DEFAULT_CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, color: c.color },
      create: { name: c.name, slug: c.slug, color: c.color },
    });
  }

  console.log("Assigning vendors to RC Cars vertical…");
  await db.vendor.updateMany({
    where: { categoryId: null },
    data: { categoryId: rcCars.id },
  });

  console.log("Seeding playbooks…");
  for (const p of PLAYBOOKS) {
    const existing = await db.playbook.findFirst({ where: { title: p.title } });
    if (existing) {
      await db.playbook.update({
        where: { id: existing.id },
        data: { kind: p.kind, content: p.content, order: p.order, categoryId: rcCars.id },
      });
    } else {
      await db.playbook.create({
        data: { title: p.title, kind: p.kind, content: p.content, order: p.order, categoryId: rcCars.id },
      });
    }
  }

  console.log("Applying known brand socials…");
  for (const s of SOCIALS) {
    await db.vendor.updateMany({
      where: { name: { contains: s.match } },
      data: {
        ...(s.instagramUrl ? { instagramUrl: s.instagramUrl } : {}),
        ...(s.youtubeUrl ? { youtubeUrl: s.youtubeUrl } : {}),
        ...(s.websiteUrl ? { websiteUrl: s.websiteUrl } : {}),
        ...(s.indiamartUrl ? { indiamartUrl: s.indiamartUrl } : {}),
      },
    });
  }

  console.log("✓ Seed done.");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
