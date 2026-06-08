"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// A task-list section that's collapsed by default — tap the header (which shows
// the count) to expand the tasks underneath.
export function CollapsibleSection({
  label,
  count,
  tone,
  defaultOpen = false,
  children,
}: {
  label: string;
  count: number;
  tone?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span
          className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${tone ?? "text-slate-500"}`}
        >
          {label}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
            {count}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-2 px-2 pb-2">{children}</div>}
    </section>
  );
}
