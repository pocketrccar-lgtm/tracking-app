import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      vendor: true,
      category: true,
      priceHistory: { orderBy: { recordedAt: "desc" } },
      purchaseOrders: { orderBy: { orderedAt: "desc" } },
    },
  });
  if (!product) notFound();

  return (
    <div className="px-4 pt-5 pb-28 space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">{product.name}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            <Link href={`/vendors/${product.vendor.id}`} className="text-amber-600 hover:underline">
              {product.vendor.name}
            </Link>
            {product.brand ? ` · ${product.brand}` : ""}
            {product.scale ? ` · ${product.scale}` : ""}
            {product.bodyShell ? ` · ${product.bodyShell}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.driftCapable && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800">drift</Badge>
            )}
            {product.ledLights && <Badge variant="outline">LED</Badge>}
            <Badge variant="outline" className={product.inStock ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 dark:text-gray-400"}>
              {product.inStock ? "in stock" : "out of stock"}
            </Badge>
            {product.category && (
              <Badge variant="outline">{product.category.name}</Badge>
            )}
          </div>
        </div>
        <Link href={`/products/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
          Edit
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400">Wholesale</div>
            <div className="mt-1 text-3xl font-bold font-mono text-slate-900 dark:text-gray-100">
              {product.wholesalePrice ? `₹${product.wholesalePrice}` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400">Retail</div>
            <div className="mt-1 text-3xl font-bold font-mono text-slate-900 dark:text-gray-100">
              {product.retailPrice ? `₹${product.retailPrice}` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400">MOQ</div>
            <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-gray-100">
              {product.moq ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {product.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-line">{product.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Price history</CardTitle></CardHeader>
        <CardContent>
          {product.priceHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">No price changes recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recorded</TableHead>
                  <TableHead className="text-right">Wholesale</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.priceHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">
                      {format(h.recordedAt, "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {h.wholesalePrice ? `₹${h.wholesalePrice}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {h.retailPrice ? `₹${h.retailPrice}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">{h.moq ?? "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-gray-400">{h.recordedBy ?? "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-gray-400">{h.notes ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Purchase orders</CardTitle>
        </CardHeader>
        <CardContent>
          {product.purchaseOrders.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">
              No POs.{" "}
              <Link
                href={`/purchase-orders/new?vendorId=${product.vendor.id}&productId=${product.id}`}
                className="text-amber-600 underline"
              >
                Create one
              </Link>
              .
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit ₹</TableHead>
                  <TableHead className="text-right">Total ₹</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/purchase-orders/${po.id}`} className="text-xs hover:text-amber-600">
                        #{po.id.slice(-6)}
                      </Link>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
