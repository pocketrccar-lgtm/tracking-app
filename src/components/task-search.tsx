"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

// Search tasks by keyword (title) or task ID (#12 or 12). Debounced → ?q=.
export function TaskSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      router.push(`/tasks?${params.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tasks or #ID"
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/15"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
