import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ChevronRight, Plus } from "lucide-react";

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

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold min-h-[44px] inline-flex items-center ${
      active
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300"
    }`;

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} SKU${products.length === 1 ? "" : "s"}`}
        action={
          <Link
            href="/products/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4" /> Add
          </Link>
        }
      />
      <div className="px-4 pt-5 pb-28 space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <Link href="/products" className={chip(!params.drift && !params.scale)}>
            All
          </Link>
          <Link href="/products?drift=yes" className={chip(params.drift === "yes")}>
            Drift only
          </Link>
          {["1:18", "1:24", "1:64", "1:10"].map((sc) => (
            <Link
              key={sc}
              href={`/products?scale=${sc}`}
              className={chip(params.scale === sc)}
            >
              {sc}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-slate-500 dark:text-gray-400">
              No products match.{" "}
              <Link href="/products/new" className="text-amber-600 underline">
                Add one
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="block rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-gray-100">
                      {p.name}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-gray-400">
                      {p.vendor.name}
                      {p.brand ? ` · ${p.brand}` : ""}
                      {p.bodyShell ? ` · ${p.bodyShell}` : ""}
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-gray-600" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {p.scale && <Badge variant="outline">{p.scale}</Badge>}
                  {p.driftCapable && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      drift
                    </Badge>
                  )}
                  {p.ledLights && <Badge variant="outline">LED</Badge>}
                  {p.wholesalePrice != null && (
                    <span className="ml-auto font-mono text-sm font-semibold text-slate-900 dark:text-gray-100">
                      ₹{p.wholesalePrice}
                    </span>
                  )}
                  {p.moq != null && (
                    <span className="text-xs text-slate-400 dark:text-gray-500">
                      MOQ {p.moq}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
