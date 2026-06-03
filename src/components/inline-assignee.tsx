"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, ChevronRight, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type Person = { id: string; name: string };

/**
 * Tap "Assigned to …" to open a picker and reassign the task (or unassign).
 */
export function InlineAssignee({
  current,
  users,
  save,
}: {
  current: Person | null;
  users: Person[];
  save: (assignedToId: string | null) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Person | null>(current);
  const [, start] = useTransition();

  const pick = (next: Person | null) => {
    setSel(next); // optimistic
    setOpen(false);
    start(async () => {
      try {
        await save(next?.id ?? null);
        router.refresh();
      } catch {
        setSel(current);
        toast.error("Couldn't update");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 p-4 text-left active:bg-slate-50"
      >
        <User className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 text-sm text-slate-700">
          {sel ? (
            <>
              Assigned to{" "}
              <span className="font-semibold text-slate-900">{sel.name}</span>
            </>
          ) : (
            <span className="text-slate-400">Unassigned — tap to assign</span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} title="Assign to">
        <div className="space-y-1 pt-1">
          {users.map((u) => {
            const active = sel?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => pick(u)}
                className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 text-sm font-semibold ${
                  active ? "bg-red-50 text-red-700" : "text-slate-700 active:bg-slate-100"
                }`}
              >
                {u.name}
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => pick(null)}
            className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 text-sm font-semibold ${
              !sel ? "bg-red-50 text-red-700" : "text-slate-500 active:bg-slate-100"
            }`}
          >
            Unassigned
            {!sel && <Check className="h-4 w-4" />}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
