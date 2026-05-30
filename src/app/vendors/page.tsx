// Stub — Agent A will replace with full list + filters + search
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function VendorsPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <h2 className="text-xl font-semibold text-slate-900">Vendors</h2>
      <p className="mt-2 text-sm text-slate-500">
        Full list + filters coming from Agent A.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
