import { db } from "@/lib/db";
import { createPurchaseOrder } from "@/actions/purchase-orders";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PO_STATUSES } from "@/lib/enums";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewPOPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string; productId?: string }>;
}) {
  const { vendorId, productId } = await searchParams;
  const [vendors, products] = await Promise.all([
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.product.findMany({ select: { id: true, name: true, vendorId: true, wholesalePrice: true }, orderBy: { name: "asc" } }),
  ]);

  const defaultProduct = productId ? products.find((p) => p.id === productId) : null;

  return (
    <div className="space-y-4">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to POs
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">New purchase order</h1>

      <form action={createPurchaseOrder} className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <Label htmlFor="vendorId">Vendor *</Label>
              <select
                id="vendorId"
                name="vendorId"
                required
                defaultValue={vendorId ?? defaultProduct?.vendorId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
              >
                <option value="">Select vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="productId">Product</Label>
              <select
                id="productId"
                name="productId"
                defaultValue={productId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
              >
                <option value="">(no product link)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required defaultValue={1} />
              </div>
              <div>
                <Label htmlFor="unitCost">Unit cost ₹ *</Label>
                <Input
                  id="unitCost"
                  name="unitCost"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={defaultProduct?.wholesalePrice ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="SAMPLE"
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
              <Textarea id="notes" name="notes" rows={3} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit">Create PO</Button>
        </div>
      </form>
    </div>
  );
}
