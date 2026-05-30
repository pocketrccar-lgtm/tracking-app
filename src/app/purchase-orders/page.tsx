import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PO_STATUSES } from "@/lib/enums";
import { ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;

  const pos = await db.purchaseOrder.findMany({
    where,
    orderBy: { orderedAt: "desc" },
    include: { vendor: true, product: true },
    take: 200,
  });

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold min-h-[44px] inline-flex items-center whitespace-nowrap ${
      active
        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
    }`;

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        subtitle={`${pos.length} PO${pos.length === 1 ? "" : "s"}`}
        action={
          <Link href="/purchase-orders/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" /> New
          </Link>
        }
      />
      <div className="px-4 pt-5 pb-28 space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <Link href="/purchase-orders" className={chip(!params.status)}>
            All
          </Link>
          {PO_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/purchase-orders?status=${s}`}
              className={chip(params.status === s)}
            >
              {s.replace(/_/g, " ").toLowerCase()}
            </Link>
          ))}
        </div>

        {pos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-slate-500 dark:text-neutral-400">
              No purchase orders yet.{" "}
              <Link href="/purchase-orders/new" className="text-red-600 underline">
                Create one
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pos.map((po) => (
              <Link
                key={po.id}
                href={`/purchase-orders/${po.id}`}
                className="block rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
                      {po.vendor.name}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
                      {po.product ? po.product.name : "no product link"} · #{po.id.slice(-6)}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {po.status.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-neutral-600" />
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                  <span>
                    {po.quantity} × <span className="font-mono">₹{po.unitCost}</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-neutral-100">
                    = ₹{po.totalCost}
                  </span>
                  <span className="ml-auto">{format(po.orderedAt, "dd MMM")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
