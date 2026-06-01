"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateTaskStatus } from "@/actions/tasks";
import { TaskPhasePicker } from "@/components/task-phase-picker";
import { toast } from "sonner";

export function TaskRow({
  id,
  title,
  status,
  priority,
  vendorName,
  assigneeName,
  catLabel,
  dueLabel,
  overdue,
  note,
  showPhase,
  phaseKey,
}: {
  id: string;
  title: string;
  status: string;
  priority: string;
  vendorName?: string | null;
  assigneeName?: string | null;
  catLabel?: string | null;
  dueLabel?: string | null;
  overdue?: boolean;
  note?: string | null;
  showPhase?: boolean;
  phaseKey?: string | null;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [done, setDone] = useState(status === "COMPLETED");
  const hot = priority === "HIGH" || priority === "URGENT";

  const toggle = () => {
    const next = !done;
    setDone(next); // optimistic
    start(async () => {
      try {
        await updateTaskStatus(id, next ? "COMPLETED" : "PENDING");
        router.refresh();
        if (next) toast.success("✅ Done — one step closer to ₹30L");
      } catch {
        setDone(!next);
        toast.error("Couldn't update");
      }
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white pr-2">
      {/* quick-complete — big left thumb target */}
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? "Mark not done" : "Mark complete"}
        className="flex h-12 w-12 shrink-0 items-center justify-center"
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300"
          }`}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
      </button>

      {/* tap to view */}
      <Link href={`/tasks/${id}`} className="min-w-0 flex-1 py-2.5 active:opacity-70">
        <div className="flex items-center gap-1.5">
          {hot && !done && (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                priority === "URGENT" ? "bg-red-600" : "bg-amber-500"
              }`}
            />
          )}
          <span
            className={`min-w-0 flex-1 truncate text-sm font-semibold ${
              done ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          >
            {title}
          </span>
          {catLabel && !done && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {catLabel}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
          {note && !done && (
            <span className="shrink-0 rounded-full bg-teal-50 px-1.5 font-bold text-teal-700">
              {note}
            </span>
          )}
          {dueLabel && (
            <span
              className={`font-semibold ${
                overdue && !done ? "text-red-600" : "text-slate-500"
              }`}
            >
              {dueLabel}
            </span>
          )}
          {dueLabel && (vendorName || assigneeName) && (
            <span className="text-slate-300">·</span>
          )}
          <span className="truncate text-slate-500">
            {vendorName ?? "No vendor"}
            {assigneeName ? ` · @${assigneeName}` : ""}
          </span>
        </div>
      </Link>

      {showPhase && <TaskPhasePicker taskId={id} phase={phaseKey ?? null} />}
    </div>
  );
}
