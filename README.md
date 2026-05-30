# BCH Sourcing OS — Vendor Tracking App

Vendor + task + purchase-cost tracker for the BCH RC car launch (drift RC, ₹800–₹2,500 retail).

Built for Syed (admin) and Shoaib (field).

## Stack

- **Next.js 16** App Router + Turbopack
- **TypeScript** + Tailwind CSS v4
- **shadcn/ui** components (base-ui under the hood)
- **Prisma 6** ORM
- **PostgreSQL** (Vercel Postgres / Supabase / Neon)
- Deployed on **Vercel**, source on **GitHub**

## Local development

```bash
npm install
npx vercel link            # link this folder to the Vercel project (first time)
npx vercel env pull .env   # pulls POSTGRES_PRISMA_URL + POSTGRES_URL_NON_POOLING
npm run db:migrate         # create tables
npm run dev                # http://localhost:3000
```

## Vercel deploy

1. Push to GitHub — Vercel auto-detects Next.js (via `vercel.json` `framework: nextjs`).
2. **Required env vars** (auto-set by the Supabase Vercel integration when you connect a Supabase project to this Vercel project — Storage tab):
   - `POSTGRES_PRISMA_URL` (pooled, pgbouncer) — for app queries
   - `POSTGRES_URL_NON_POOLING` (direct) — for `prisma migrate deploy`
3. First-time seed against production DB:
   ```bash
   npx vercel env pull .env
   npm run db:deploy && npm run db:seed && npm run db:import-vendors
   ```

## Data model (Prisma)

- `Vendor` — name, type, tier, status, drift status, BCH relevance, GST/CIN, location, founder details
- `VendorPhone` / `VendorEmail` — multiple per vendor
- `Category` + `VendorCategory` — many-to-many tagging (drift RC, parts, OEM, moulders, etc.)
- `Product` + `PriceHistory` — per-vendor SKUs with wholesale/retail/MOQ and price tracking over time
- `Task` — call/visit/DM/sample-order tracking with priority + due date + assignee
- `Interaction` — log every call/visit/message with outcome
- `PurchaseOrder` — sample orders + bulk POs with status (sample → received → QA passed)
- `User` — Syed (admin) + Shoaib (field)

## Source of vendor data

Seed script imports ~130 supply-side vendors from the SOURCING_HQ research repo's
[`SHOAIB_MASTER_CALL_LIST.md`](https://github.com/bharathcyclehub-a11y/SOURCING_HQ/blob/main/RC_RESEARCH/SHOAIB_MASTER_CALL_LIST.md) —
Tier 1 drift-confirmed importers (Ratnaakar / Mayatra / Loty / Shine Traders / CTM Toys / etc.),
Tier 2 strong-signal supply-side (Mirana / Bharat Hobby / Hemani Exim / KV Toys / DeoDap),
Tier 3 verify-drift (~65 vendors), Tier 4 IndiaMART-gated, plus Chinese factories and Mumbai/Bangalore moulders.

## Pages

| Route | Purpose |
|---|---|
| `/dashboard` | Stats + recent vendors + tier breakdown |
| `/vendors` | Searchable, filterable vendor list |
| `/vendors/[id]` | Vendor detail: phones, products, tasks, interactions |
| `/tasks` | Kanban board + per-assignee queues |
| `/products` | Per-vendor SKUs + price history + purchase cost |
| `/categories` | Category management + vendor count |

## Roles

- **admin** (Syed) — full access
- **field** (Shoaib) — assigned-task queue + intake forms

## Status

This commit is the **bootstrap**. Vendor / task / product UIs are placeholders, to be filled by parallel agents.
