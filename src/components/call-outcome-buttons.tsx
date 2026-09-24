"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logCallOutcome } from "@/actions/vendors";
import { CALL_OUTCOMES, CALL_OUTCOME_ICONS, CALL_OUTCOME_LABELS, type CallOutcome } from "@/lib/enums";
import { cn } from "@/lib/utils";

const STYLE: Record<CallOutcome, string> = {
  NO_ANSWER: "bg-slate-100 text-slate-700 border-slate-200",
  QUALITY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WASTE: "bg-rose-50 text-rose-700 border-rose-200",
};

const DONE: Record<CallOutcome, string> = {
  NO_ANSWER: "📵 No answer logged — stays in Pending",
  QUALITY: "⭐ Marked quality lead",
  WASTE: "🗑 Marked waste lead — moved to Lost lead",
};

/**
 * One-tap call outcome. `compact` = a single "No answer" icon button for list cards
 * (the most common result after dialling from the list); full = all three buttons.
 */
export function CallOutcomeButtons({
  vendorId,
  compact = false,
}: {
  vendorId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const log = (e: React.MouseEvent, outcome: CallOutcome) => {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      try {
        await logCallOutcome(vendorId, outcome);
        toast.success(DONE[outcome]);
        router.refresh();
      } catch {
        toast.error("Couldn't log the call");
      }
    });
  };

  if (compact) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => log(e, "NO_ANSWER")}
        aria-label="Log: no answer"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg active:scale-90 transition-transform disabled:opacity-50"
      >
        📵
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {CALL_OUTCOMES.map((o) => (
        <button
          key={o}
          type="button"
          disabled={pending}
          onClick={(e) => log(e, o)}
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-semibold active:scale-[0.97] transition-transform disabled:opacity-50",
            STYLE[o],
          )}
        >
          <span className="text-lg leading-none">{CALL_OUTCOME_ICONS[o]}</span>
          <span className="mt-1">{CALL_OUTCOME_LABELS[o]}</span>
        </button>
      ))}
    </div>
  );
}
