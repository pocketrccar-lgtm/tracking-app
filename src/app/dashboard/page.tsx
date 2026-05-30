import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TIER_COLORS, VENDOR_TIER_LABELS, type VendorTier } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    vendorCount,
    driftConfirmedCount,
    tasksPending,
    tasksDoneToday,
    onboardedCount,
    samplesOrdered,
    byTier,
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
    db.vendor.count({ where: { status: "ONBOARDED" } }),
    db.purchaseOrder.count(),
    db.vendor.groupBy({
      by: ["tier"],
      _count: { _all: true },
    }),
    db.vendor.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { phones: { take: 1 } },
    }),
  ]);

  const stats = [
    { label: "Vendors", value: vendorCount, sub: `${onboardedCount} onboarded` },
    { label: "Drift confirmed", value: driftConfirmedCount, sub: "tier 1 leads" },
    { label: "Tasks pending", value: tasksPending, sub: `${tasksDoneToday} done today` },
    { label: "Sample orders", value: samplesOrdered, sub: "all-time" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            BCH RC sourcing overview — Syed + Shoaib
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/vendors" className={buttonVariants({ variant: "outline" })}>
            Browse vendors
          </Link>
          <Link href="/vendors/new" className={buttonVariants()}>
            Add vendor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                {s.label}
              </div>
              <div className="mt-1 text-3xl font-bold text-slate-900">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendors by tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byTier.length === 0 ? (
              <p className="text-sm text-slate-500">
                No vendors yet. Run the import script or{" "}
                <Link href="/vendors/new" className="text-emerald-600 underline">
                  add one manually
                </Link>
                .
              </p>
            ) : (
              byTier.map((t) => {
                const tier = t.tier as VendorTier;
                return (
                  <div
                    key={t.tier}
                    className="flex items-center justify-between"
                  >
                    <Badge
                      variant="outline"
                      className={TIER_COLORS[tier] ?? ""}
                    >
                      {VENDOR_TIER_LABELS[tier] ?? t.tier}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700">
                      {t._count._all}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently updated</CardTitle>
          </CardHeader>
          <CardContent>
            {recentVendors.length === 0 ? (
              <p className="text-sm text-slate-500">No vendors yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentVendors.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/vendors/${v.id}`}
                      className="flex items-center justify-between rounded-md p-2 -mx-2 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {v.name}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {v.city ?? "—"}, {v.state ?? "—"} ·{" "}
                          {v.phones[0]?.phone ?? "no phone"}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        {v.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
