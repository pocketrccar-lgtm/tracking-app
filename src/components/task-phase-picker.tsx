"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { setTaskPhase } from "@/actions/tasks";
import { PHASES } from "@/lib/roadmap";
import { toast } from "sonner";

const CHIP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
  red: "bg-red-100 text-red-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

// `phase` is the EFFECTIVE phase (what the task shows as now); the picker writes
// a manual override, or clears it back to auto.
export function TaskPhasePicker({
  taskId,
  phase,
}: {
  taskId: string;
  phase: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const current = PHASES.find((p) => p.key === phase);

  const pick = (key: string) =>
    start(async () => {
      await setTaskPhase(taskId, key);
      toast.success(
        key ? `Moved to ${PHASES.find((p) => p.key === key)?.label}` : "Set to auto",
      );
      router.refresh();
      setOpen(false);
    });

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
          current ? CHIP[current.color] ?? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        {current ? current.label : "+ phase"}
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} title="Move to phase">
        <div className="space-y-2 pt-1">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => pick(p.key)}
              disabled={pending}
              className={`flex min-h-[52px] w-full items-center justify-between rounded-xl px-4 text-left text-sm font-semibold ${
                phase === p.key ? "bg-red-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              <span>{p.label}</span>
              <span className={`text-xs ${phase === p.key ? "text-white/70" : "text-slate-400"}`}>
                {p.tagline}
              </span>
            </button>
          ))}
          <button
            onClick={() => pick("")}
            disabled={pending}
            className="min-h-[44px] w-full rounded-xl px-4 text-sm font-semibold text-slate-500"
          >
            Reset to auto
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
