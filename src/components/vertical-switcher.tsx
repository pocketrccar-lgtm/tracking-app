"use client";

import { useTransition } from "react";
import { switchVertical } from "@/actions/vertical";
import { cn } from "@/lib/utils";

type V = { id: string; name: string; color: string | null };

// Static class strings (Tailwind can't see dynamic ones).
const ACTIVE: Record<string, string> = {
  red: "bg-red-600 text-white",
  emerald: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-white",
};

/** Top bar: app name + one pill per category. Every page below follows the active pill. */
export function VerticalSwitcher({ verticals, current }: { verticals: V[]; current: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <span className="shrink-0 text-sm font-bold tracking-tight text-slate-900">Sourcing OS</span>
      <div className="ml-auto flex gap-1.5 overflow-x-auto">
        {verticals.map((v) => {
          const active = v.id === current;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={active}
              disabled={pending || active}
              onClick={() => start(() => switchVertical(v.id))}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? (ACTIVE[v.color ?? ""] ?? "bg-slate-900 text-white")
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                pending && !active && "opacity-60",
              )}
            >
              {v.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
