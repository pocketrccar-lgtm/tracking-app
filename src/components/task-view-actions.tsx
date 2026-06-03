"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { updateTaskStatus, snoozeTask, deleteTask } from "@/actions/tasks";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/enums";
import { Check, MoreHorizontal, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TaskViewActions({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const done = status === "COMPLETED";

  const setStatus = (s: string) =>
    start(async () => {
      await updateTaskStatus(taskId, s);
      toast.success(`Set to ${TASK_STATUS_LABELS[s as keyof typeof TASK_STATUS_LABELS] ?? s}`);
      router.refresh();
      setSheet(false);
    });

  const snooze = (days: number, label: string) =>
    start(async () => {
      await snoozeTask(taskId, days);
      toast.success(`Snoozed to ${label}`);
      router.refresh();
      setSheet(false);
    });

  const doDelete = () => {
    setDeleting(true);
    start(async () => {
      try {
        await deleteTask(taskId); // redirects to /tasks
      } catch {
        toast.error("Couldn't delete");
        setDeleting(false);
        setConfirm(false);
      }
    });
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2 p-3">
          <Button
            onClick={() => setStatus(done ? "PENDING" : "COMPLETED")}
            disabled={pending}
            size="lg"
            variant={done ? "outline" : "default"}
            className="flex-1"
          >
            <Check className="h-4 w-4" /> {done ? "Reopen" : "Mark complete"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setSheet(true)}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomSheet open={sheet} onOpenChange={setSheet} title="Task actions">
        <div className="space-y-4 pt-1">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Set status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TASK_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  disabled={pending}
                  className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold ${
                    s === status
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {TASK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Snooze due date
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => snooze(1, "tomorrow")}
                disabled={pending}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700"
              >
                <Clock className="h-4 w-4" /> +1 day
              </button>
              <button
                onClick={() => snooze(7, "next week")}
                disabled={pending}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700"
              >
                <Clock className="h-4 w-4" /> +1 week
              </button>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setSheet(false);
              setConfirm(true);
            }}
            className="w-full text-red-600"
          >
            <Trash2 className="h-4 w-4" /> Delete task
          </Button>
        </div>
      </BottomSheet>

      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this task?"
        description="This permanently removes the task. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={doDelete}
        loading={deleting}
      />
    </>
  );
}
