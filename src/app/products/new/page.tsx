import { db } from "@/lib/db";
import { createProduct } from "@/actions/products";
import { ProductForm } from "@/components/product-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  const { vendorId } = await searchParams;
  const [vendors, categories] = await Promise.all([
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="px-4 pt-5 pb-28 space-y-4">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Add product</h1>
      <ProductForm
        vendors={vendors}
        categories={categories}
        defaultVendorId={vendorId}
        action={createProduct}
        submitLabel="Create product"
      />
    </div>
  );
}
