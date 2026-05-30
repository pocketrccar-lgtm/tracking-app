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

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ drift?: string; scale?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  if (params.drift === "yes") where.driftCapable = true;
  if (params.scale) where.scale = params.scale;

  const products = await db.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { vendor: true },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{products.length} products</p>
        </div>
        <Link href="/products/new" className={buttonVariants()}>
          Add product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full px-3 py-1 text-xs ${!params.drift ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All
        </Link>
        <Link
          href="/products?drift=yes"
          className={`rounded-full px-3 py-1 text-xs ${params.drift === "yes" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Drift only
        </Link>
        {["1:18", "1:24", "1:64", "1:10"].map((sc) => (
          <Link
            key={sc}
            href={`/products?scale=${sc}`}
            className={`rounded-full px-3 py-1 text-xs ${params.scale === sc ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {sc}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-slate-500">
            No products match.{" "}
            <Link href="/products/new" className="text-emerald-600 underline">
              Add one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="hidden md:table-cell">Brand</TableHead>
                <TableHead>Scale</TableHead>
                <TableHead>Drift</TableHead>
                <TableHead className="text-right">Wholesale</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">MOQ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <Link href={`/products/${p.id}`} className="hover:text-emerald-600">
                      {p.name}
                    </Link>
                    {p.bodyShell && (
                      <div className="text-xs text-slate-500">{p.bodyShell}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/vendors/${p.vendor.id}`}
                      className="text-xs hover:text-emerald-600"
                    >
                      {p.vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-slate-600">
                    {p.brand ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">{p.scale ?? "—"}</TableCell>
                  <TableCell>
                    {p.driftCapable ? (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                        drift
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {p.wholesalePrice ? `₹${p.wholesalePrice}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {p.retailPrice ? `₹${p.retailPrice}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {p.moq ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
