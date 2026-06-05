import { db } from "@/lib/db";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VendorListFilters } from "@/components/vendor-list-filters";
import { RankBadge } from "@/components/rank-badge";
import {
  STATUS_COLORS,
  MARKET_LEVEL_COLORS,
  MARKET_LEVEL_LABELS,
  VENDOR_STATUS_LABELS,
  VENDOR_TYPE_LABELS,
  type VendorStatus,
  type VendorType,
  type MarketLevel,
} from "@/lib/enums";
import { formatDistanceToNow } from "date-fns";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// compact drift indicator — only for the meaningful states
function DriftTag({ s }: { s: string }) {
  if (s === "YES_CONFIRMED")
    return (
      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
        🏁 Drift
      </span>
    );
  if (s === "LIKELY")
    return (
      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
        Drift?
      </span>
    );
  return null;
}

export default async function VendorsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    state?: string;
    tier?: string;
    type?: string;
    status?: string;
    drift?: string;
    marketLevel?: string;
    supply?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (params.state) where.state = params.state;
  if (params.tier) where.tier = params.tier;
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  if (params.drift) where.driftStatus = params.drift;
  if (params.marketLevel) where.marketLevel = params.marketLevel;
  if (params.supply === "1") where.rank = { not: null };
  if (params.q) {
    const q = params.q;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { phones: { some: { phone: { contains: q } } } },
    ];
  }

  // Default sort = supply rank (ranked suppliers first, #1 at top), then volume.
  const sort = params.sort ?? "rank";
  const orderBy =
    sort === "volume"
      ? [{ volumeScore: { sort: "desc", nulls: "last" } as const }, { updatedAt: "desc" as const }]
      : sort === "recent"
        ? [{ updatedAt: "desc" as const }]
        : [
            { rank: { sort: "asc", nulls: "last" } as const },
            { volumeScore: { sort: "desc", nulls: "last" } as const },
            { bchRelevance: "desc" as const },
          ];

  const [vendors, total, distinctStates] = await Promise.all([
    db.vendor.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: { phones: { take: 1 } },
    }),
    db.vendor.count({ where }),
    db.vendor.findMany({
      where: { state: { not: null } },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    }),
  ]);

  const states = distinctStates
    .map((s) => s.state)
    .filter((s): s is string => Boolean(s));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-4 pt-5 pb-28 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Vendors</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            {total.toLocaleString()} supply-side vendors · page {page} of{" "}
            {pages}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendors/new"
            className={buttonVariants()}
          >
            Add vendor
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <VendorListFilters states={states} />
        </CardContent>
      </Card>

      {vendors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-slate-500 dark:text-neutral-400">
            No vendors match these filters.{" "}
            <Link
              href="/vendors"
              className="text-red-600 underline"
            >
              Clear filters
            </Link>{" "}
            or{" "}
            <Link
              href="/vendors/new"
              className="text-red-600 underline"
            >
              add one manually
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>City, State</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800">
                    <TableCell>
                      {v.rank ? (
                        <RankBadge rank={v.rank} />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/vendors/${v.id}`}
                          className="hover:text-red-600"
                        >
                          {v.name}
                        </Link>
                        <DriftTag s={v.driftStatus} />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-neutral-300">
                      {VENDOR_TYPE_LABELS[v.type as VendorType] ?? v.type}
                    </TableCell>
                    <TableCell>
                      {v.marketLevel ? (
                        <Badge
                          variant="outline"
                          className={MARKET_LEVEL_COLORS[v.marketLevel as MarketLevel] ?? ""}
                        >
                          {MARKET_LEVEL_LABELS[v.marketLevel as MarketLevel] ?? v.marketLevel}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.volumeScore != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{ width: `${v.volumeScore}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-slate-500">
                            {v.volumeScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-neutral-300">
                      {[v.city, v.state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {v.phones[0]?.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[v.status as VendorStatus] ?? ""}
                      >
                        {VENDOR_STATUS_LABELS[v.status as VendorStatus] ??
                          v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500 dark:text-neutral-400">
                      {formatDistanceToNow(v.updatedAt, { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <Link
                  href={`/vendors/${v.id}`}
                  className="min-w-0 flex-1 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {v.rank ? (
                        <RankBadge rank={v.rank} className="shrink-0" />
                      ) : null}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {v.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {[v.city, v.state].filter(Boolean).join(", ") || "—"}
                        </div>
                      </div>
                    </div>
                    {v.marketLevel ? (
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${MARKET_LEVEL_COLORS[v.marketLevel as MarketLevel] ?? ""}`}
                      >
                        {(v.marketLevel as string) === "ABOVE_GREY"
                          ? "Above grey"
                          : (v.marketLevel as string) === "GREY"
                            ? "Grey"
                            : "Retail"}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-700">
                    {v.phones[0]?.phone ?? "no phone"}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <DriftTag s={v.driftStatus} />
                    <Badge variant="outline" className="bg-slate-50 text-slate-600">
                      {VENDOR_TYPE_LABELS[v.type as VendorType] ?? v.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[v.status as VendorStatus] ?? ""}
                    >
                      {VENDOR_STATUS_LABELS[v.status as VendorStatus] ?? v.status}
                    </Badge>
                    {v.volumeScore != null ? (
                      <span className="text-xs font-medium text-slate-400">
                        vol {v.volumeScore}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <WhatsAppButton phone={v.phones[0]?.phone} vendorName={v.name} />
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {page > 1 && (
                <Link
                  href={`/vendors?${new URLSearchParams({
                    ...(params as Record<string, string>),
                    page: String(page - 1),
                  })}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  ← Prev
                </Link>
              )}
              <span className="px-3 py-1.5 text-sm text-slate-500 dark:text-neutral-400">
                Page {page} of {pages}
              </span>
              {page < pages && (
                <Link
                  href={`/vendors?${new URLSearchParams({
                    ...(params as Record<string, string>),
                    page: String(page + 1),
                  })}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
