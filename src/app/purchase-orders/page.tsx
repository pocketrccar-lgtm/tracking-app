import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { PO_STATUSES } from "@/lib/enums";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase orders</h1>
          <p className="text-sm text-slate-500">{pos.length} POs</p>
        </div>
        <Link href="/purchase-orders/new" className={buttonVariants()}>
          New PO
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/purchase-orders"
          className={`rounded-full px-3 py-1 text-xs ${!params.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All
        </Link>
        {PO_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/purchase-orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs ${params.status === s ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {pos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-slate-500">
            No purchase orders yet.{" "}
            <Link href="/purchase-orders/new" className="text-emerald-600 underline">
              Create one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit ₹</TableHead>
                <TableHead className="text-right">Total ₹</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id} className="hover:bg-slate-50">
                  <TableCell className="text-xs font-mono">
                    <Link href={`/purchase-orders/${po.id}`} className="hover:text-emerald-600">
                      #{po.id.slice(-6)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/vendors/${po.vendor.id}`} className="text-xs hover:text-emerald-600">
                      {po.vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    {po.product ? (
                      <Link href={`/products/${po.product.id}`} className="hover:text-emerald-600">
                        {po.product.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">{po.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-xs">₹{po.unitCost}</TableCell>
                  <TableCell className="text-right font-mono text-xs">₹{po.totalCost}</TableCell>
                  <TableCell><Badge variant="outline">{po.status}</Badge></TableCell>
                  <TableCell className="text-xs">{format(po.orderedAt, "yyyy-MM-dd")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
