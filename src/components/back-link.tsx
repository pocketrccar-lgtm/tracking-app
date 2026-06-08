"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Go one step back to wherever you came from (e.g. the list view), not a
// hardcoded page. Falls back to the list view on a fresh/direct load.
export function BackLink({
  fallback = "/tasks?view=list",
  label = "Back",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
