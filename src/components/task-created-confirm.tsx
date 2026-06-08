"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Check } from "lucide-react";

// Shown after creating task(s): confirms the #ID, title and assignee, with a
// Done button. Driven by the ?created=<ids> param the create actions redirect to.
export function TaskCreatedConfirm({
  tasks,
}: {
  tasks: { seq: number; title: string; assigneeName: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    router.replace("/tasks?view=list");
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
      title={tasks.length > 1 ? `${tasks.length} tasks created ✅` : "Task created ✅"}
    >
      <div className="space-y-2 pt-1">
        {tasks.map((t) => (
          <div key={t.seq} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">#{t.seq}</span>
              <span className="flex-1 text-sm font-semibold text-slate-900">{t.title}</span>
            </div>
            <div className="mt-0.5 pl-7 text-xs font-medium text-slate-500">
              @{t.assigneeName ?? "Unassigned"}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={close}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 text-sm font-bold text-white active:scale-[0.99]"
        >
          <Check className="h-4 w-4" /> Done
        </button>
      </div>
    </BottomSheet>
  );
}
