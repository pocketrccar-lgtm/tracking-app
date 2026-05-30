import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updateProduct } from "@/actions/products";
import { ProductForm } from "@/components/product-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, vendors, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="px-4 pt-5 pb-28 space-y-4">
      <Link
        href={`/products/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to product
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Edit {product.name}</h1>
      <ProductForm
        product={product}
        vendors={vendors}
        categories={categories}
        action={action}
        submitLabel="Save changes"
      />
    </div>
  );
}
