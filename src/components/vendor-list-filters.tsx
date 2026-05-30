"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  VENDOR_TYPES,
  VENDOR_TIERS,
  VENDOR_STATUSES,
  DRIFT_STATUSES,
  VENDOR_TYPE_LABELS,
  VENDOR_TIER_LABELS,
  VENDOR_STATUS_LABELS,
  DRIFT_STATUS_LABELS,
} from "@/lib/enums";
import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

export function VendorListFilters({ states }: { states: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => updateParam("q", q || null), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString());
      if (value && value !== "ALL") params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/vendors?${params.toString()}`);
    },
    [router, sp],
  );

  const clearAll = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/vendors?${params.toString()}`);
  };

  // count active filters (excluding search + page)
  const activeKeys = ["state", "tier", "type", "status", "drift"].filter((k) =>
    sp.get(k),
  );
  const activeCount = activeKeys.length;

  const fields: { key: string; label: string; options: { value: string; label: string }[] }[] = [
    { key: "state", label: "State", options: states.map((s) => ({ value: s, label: s })) },
    { key: "tier", label: "Tier", options: VENDOR_TIERS.map((t) => ({ value: t, label: VENDOR_TIER_LABELS[t] })) },
    { key: "type", label: "Type", options: VENDOR_TYPES.map((t) => ({ value: t, label: VENDOR_TYPE_LABELS[t] })) },
    { key: "status", label: "Status", options: VENDOR_STATUSES.map((s) => ({ value: s, label: VENDOR_STATUS_LABELS[s] })) },
    { key: "drift", label: "Drift", options: DRIFT_STATUSES.map((d) => ({ value: d, label: DRIFT_STATUS_LABELS[d] })) },
  ];

  return (
    <>
      <div className="flex gap-2">
        <Input
          placeholder="Search name / phone / city"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="relative shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* active filter chips */}
      {activeCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeKeys.map((k) => (
            <button
              key={k}
              onClick={() => updateParam(k, null)}
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
            >
              {sp.get(k)?.replace(/_/g, " ").toLowerCase()}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearAll}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <BottomSheet open={open} onOpenChange={setOpen} title="Filter vendors">
        <div className="space-y-4 pt-1">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                {f.label}
              </label>
              <select
                value={sp.get(f.key) ?? "ALL"}
                onChange={(e) => updateParam(f.key, e.target.value)}
                className={selectClass}
              >
                <option value="ALL">All {f.label.toLowerCase()}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={clearAll} className="flex-1">
              Clear all
            </Button>
            <Button onClick={() => setOpen(false)} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
