import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updateVendor } from "@/actions/vendors";
import { VendorForm } from "@/components/vendor-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await db.vendor.findUnique({
    where: { id },
    include: { phones: true, emails: true },
  });
  if (!vendor) notFound();

  const updateAction = updateVendor.bind(null, id);

  return (
    <div className="px-4 pt-5 pb-28 space-y-4">
      <Link
        href={`/vendors/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to vendor
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Edit {vendor.name}</h1>
      <VendorForm
        vendor={vendor}
        action={updateAction}
        submitLabel="Save changes"
      />
    </div>
  );
}
