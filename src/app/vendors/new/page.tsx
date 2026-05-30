import { createVendor } from "@/actions/vendors";
import { VendorForm } from "@/components/vendor-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewVendorPage() {
  return (
    <div className="px-4 pt-5 pb-28 space-y-4">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to vendors
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Add vendor</h1>
      <VendorForm action={createVendor} submitLabel="Create vendor" />
    </div>
  );
}
