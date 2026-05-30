"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function VendorListFilters({ states }: { states: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      updateParam("q", q || null);
    }, 300);
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Input
        placeholder="Search name / phone / city"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="lg:col-span-2"
      />

      <Select
        value={sp.get("state") ?? "ALL"}
        onValueChange={(v) => updateParam("state", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All states</SelectItem>
          {states.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sp.get("tier") ?? "ALL"}
        onValueChange={(v) => updateParam("tier", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All tiers</SelectItem>
          {VENDOR_TIERS.map((t) => (
            <SelectItem key={t} value={t}>
              {VENDOR_TIER_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sp.get("type") ?? "ALL"}
        onValueChange={(v) => updateParam("type", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {VENDOR_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {VENDOR_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sp.get("status") ?? "ALL"}
        onValueChange={(v) => updateParam("status", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {VENDOR_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {VENDOR_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sp.get("drift") ?? "ALL"}
        onValueChange={(v) => updateParam("drift", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Drift" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All drift</SelectItem>
          {DRIFT_STATUSES.map((d) => (
            <SelectItem key={d} value={d}>
              {DRIFT_STATUS_LABELS[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
