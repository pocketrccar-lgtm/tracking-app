import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updatePurchaseOrder } from "@/actions/purchase-orders";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PO_STATUSES } from "@/lib/enums";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function POEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: { vendor: true, product: true },
  });
  if (!po) notFound();

  const action = updatePurchaseOrder.bind(null, id);

  return (
    <div className="space-y-4">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to POs
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          PO #{po.id.slice(-6)}
        </h1>
        <p className="text-sm text-slate-500">
          <Link href={`/vendors/${po.vendor.id}`} className="text-emerald-600 hover:underline">
            {po.vendor.name}
          </Link>
          {po.product && (
            <>
              {" · "}
              <Link href={`/products/${po.product.id}`} className="text-emerald-600 hover:underline">
                {po.product.name}
              </Link>
            </>
          )}
          {" · ordered "} {format(po.orderedAt, "yyyy-MM-dd")}
          {po.receivedAt && <> · received {format(po.receivedAt, "yyyy-MM-dd")}</>}
        </p>
      </div>

      <form action={action} className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue={po.quantity} required />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit ₹</Label>
                <Input id="unitCost" name="unitCost" type="number" step="0.01" defaultValue={po.unitCost} required />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={po.status}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
                >
                  {PO_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={po.notes ?? ""} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
