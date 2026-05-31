import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import {
  TIER_COLORS,
  STATUS_COLORS,
  VENDOR_TIER_LABELS,
  VENDOR_STATUS_LABELS,
  VENDOR_STATUS_FUNNEL,
  type VendorTier,
  type VendorStatus,
} from "@/lib/enums";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    vendorCount,
    driftConfirmedCount,
    tasksPending,
    tasksDoneToday,
    activeCount,
    samplesOrdered,
    byTier,
    byStatus,
    recentVendors,
  ] = await Promise.all([
    db.vendor.count(),
    db.vendor.count({ where: { driftStatus: "YES_CONFIRMED" } }),
    db.task.count({ where: { status: "PENDING" } }),
    db.task.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    db.vendor.count({ where: { status: "ACTIVE" } }),
    db.purchaseOrder.count(),
    db.vendor.groupBy({ by: ["tier"], _count: { _all: true } }),
    db.vendor.groupBy({ by: ["status"], _count: { _all: true } }),
    db.vendor.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { phones: { take: 1 } },
    }),
  ]);

  // Sourcing funnel — count vendors at each stage (0 if none)
  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) statusCounts[row.status] = row._count._all;

  // Funnel cards — tappable, colored, lead into filtered views
  const funnel = [
    {
      label: "Vendors",
      value: vendorCount,
      sub: `${activeCount} active`,
      href: "/vendors",
      tone: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300",
    },
    {
      label: "Drift confirmed",
      value: driftConfirmedCount,
      sub: "tier-1 leads",
      href: "/vendors?drift=YES_CONFIRMED",
      tone: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Tasks pending",
      value: tasksPending,
      sub: `${tasksDoneToday} done today`,
      href: "/tasks?status=PENDING",
      tone: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Sample orders",
      value: samplesOrdered,
      sub: "all-time",
      href: "/purchase-orders",
      tone: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-300",
    },
  ];

  return (
    <div>
      <PageHeader title="Pocket RC Cars" subtitle="Sourcing OS — Syed + Shoaib" />
      <PageTransition>
        <div className="px-4 pt-5 pb-28 space-y-6">
          {/* Funnel cards */}
          <div className="grid grid-cols-2 gap-3">
            {funnel.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className={`rounded-2xl border p-4 active:scale-[0.98] transition-transform ${f.tone}`}
              >
                <div className="text-3xl font-bold tabular-nums">{f.value}</div>
                <div className="mt-1 text-sm font-semibold">{f.label}</div>
                <div className="text-xs opacity-70">{f.sub}</div>
              </Link>
            ))}
          </div>

          {/* Sourcing funnel — the path to getting products */}
          <div>
            <h2 className="px-1 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Sourcing funnel
            </h2>
            <Card>
              <CardContent className="space-y-2 p-3">
                {VENDOR_STATUS_FUNNEL.map((st, i) => {
                  const count = statusCounts[st] ?? 0;
                  const max = Math.max(
                    1,
                    ...VENDOR_STATUS_FUNNEL.map((s) => statusCounts[s] ?? 0),
                  );
                  const pct = Math.round((count / max) * 100);
                  return (
                    <Link
                      key={st}
                      href={`/vendors?status=${st}`}
                      className="block active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center justify-between pb-1">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 tabular-nums">
                            {i + 1}
                          </span>
                          {VENDOR_STATUS_LABELS[st]}
                        </span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
                {(statusCounts["DROPPED"] ?? 0) > 0 && (
                  <Link
                    href="/vendors?status=DROPPED"
                    className="flex items-center justify-between pt-1 text-xs text-slate-400"
                  >
                    <span>Dropped</span>
                    <span className="tabular-nums">{statusCounts["DROPPED"]}</span>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vendors by tier */}
          <div>
            <h2 className="px-1 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Vendors by tier
            </h2>
            <Card>
              <CardContent className="space-y-2.5 p-4">
                {byTier.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-neutral-400">
                    No vendors yet.{" "}
                    <Link href="/vendors/new" className="text-red-600 underline">
                      Add one
                    </Link>
                    .
                  </p>
                ) : (
                  byTier
                    .slice()
                    .sort((a, b) => b._count._all - a._count._all)
                    .map((t) => {
                      const tier = t.tier as VendorTier;
                      return (
                        <Link
                          key={t.tier}
                          href={`/vendors?tier=${t.tier}`}
                          className="flex items-center justify-between active:scale-[0.99] transition-transform"
                        >
                          <Badge variant="outline" className={TIER_COLORS[tier] ?? ""}>
                            {VENDOR_TIER_LABELS[tier] ?? t.tier}
                          </Badge>
                          <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300 tabular-nums">
                            {t._count._all}
                          </span>
                        </Link>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recently updated */}
          <div>
            <div className="flex items-center justify-between px-1 pb-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Recently updated
              </h2>
              <Link href="/vendors" className="text-xs font-semibold text-red-600">
                See all
              </Link>
            </div>
            <Card>
              <CardContent className="p-0">
                {recentVendors.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 dark:text-neutral-400">
                    No vendors yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {recentVendors.map((v) => (
                      <li key={v.id}>
                        <Link
                          href={`/vendors/${v.id}`}
                          className="flex items-center gap-2 px-4 py-3 min-h-[44px] active:scale-[0.99] transition-transform"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
                              {v.name}
                            </div>
                            <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
                              {[v.city, v.state].filter(Boolean).join(", ") || "—"} ·{" "}
                              {v.phones[0]?.phone ?? "no phone"}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 ${STATUS_COLORS[v.status as VendorStatus] ?? ""}`}
                          >
                            {VENDOR_STATUS_LABELS[v.status as VendorStatus] ?? v.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-neutral-600" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
