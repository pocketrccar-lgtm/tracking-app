"use client";

import { useState, useTransition } from "react";
import { TaskForm } from "@/components/task-form";
import { VoiceTaskInput, type ExtractedTask } from "@/components/voice-task-input";
import { createTask, createTasks } from "@/actions/tasks";
import { TASK_TYPES, TASK_TYPE_LABELS } from "@/lib/enums";
import { toast } from "sonner";
import { X, Sparkles } from "lucide-react";

type Vendor = { id: string; name: string };
type User = { id: string; name: string; role: string };

const chipSelect =
  "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20";

function isoPlus(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
const DUE_OPTS = [
  { label: "Today", value: isoPlus(0) },
  { label: "Tomorrow", value: isoPlus(1) },
  { label: "3 days", value: isoPlus(3) },
  { label: "This week", value: isoPlus(7) },
  { label: "This month", value: isoPlus(30) },
  { label: "No date", value: "" },
];

export function NewTaskClient({
  vendors,
  users,
  defaultVendorId,
  defaultAssigneeId,
}: {
  vendors: Vendor[];
  users: User[];
  defaultVendorId?: string;
  defaultAssigneeId?: string;
}) {
  // New tasks default to: due today + assigned to the default partner.
  const [prefill, setPrefill] = useState<{
    vendorId?: string;
    title?: string;
    type?: string;
    priority?: string;
    assignedToId?: string | null;
    dueDate?: Date | null;
    notes?: string | null;
  }>({ dueDate: new Date(), assignedToId: defaultAssigneeId ?? null });
  const [version, setVersion] = useState(0);
  const [multi, setMulti] = useState<ExtractedTask[] | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [pending, start] = useTransition();

  const onExtract = (tasks: ExtractedTask[]) => {
    if (tasks.length > 1) {
      setMulti(tasks);
      return;
    }
    const t = tasks[0];
    setMulti(null);
    setPrefill({
      vendorId: t.vendorId ?? defaultVendorId,
      title: t.title,
      type: t.type,
      priority: t.priority,
      assignedToId: t.assignedToId ?? defaultAssigneeId ?? null,
      dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
      notes: t.notes ?? null,
    });
    setVersion((v) => v + 1); // remount TaskForm with new defaults
    setVoiceOpen(false); // collapse voice — focus on the filled form
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  // assignee dropdown — the three people: Syed, Shoaib, Pandey
  const pick = (re: RegExp) =>
    users.find((u) => u.role !== "advisor" && re.test(u.name) && !/shared/i.test(u.name));
  const assigneeOpts = (
    [
      { u: pick(/syed/i), label: "Syed" },
      { u: pick(/shoaib/i), label: "Shoaib" },
      { u: pick(/pandey/i), label: "Pandey" },
    ] as const
  )
    .filter((x) => x.u)
    .map((x) => ({ id: x.u!.id, label: x.label }));

  const editField = (i: number, patch: Partial<ExtractedTask>) =>
    setMulti((m) => (m ? m.map((t, j) => (j === i ? { ...t, ...patch } : t)) : m));
  const removeTask = (i: number) =>
    setMulti((m) => (m ? m.filter((_, j) => j !== i) : m));

  const createAll = () => {
    if (!multi?.length) return;
    const payload = multi
      .filter((t) => (t.title ?? "").trim())
      .map((t) => ({
        title: t.title!.trim(),
        type: t.type,
        priority: t.priority,
        assignedToId: t.assignedToId ?? null, // respect explicit "Unassigned"
        dueDate: t.dueDate ?? todayIso,
        vendorId: t.vendorId ?? defaultVendorId ?? null,
        notes: t.notes ?? null,
      }));
    if (!payload.length) {
      toast.error("Add at least one task title");
      return;
    }
    start(async () => {
      try {
        await createTasks(payload); // redirects to /tasks
      } catch {
        toast.error("Couldn't create tasks");
      }
    });
  };

  return (
    <div className="space-y-4">
      {voiceOpen ? (
        <VoiceTaskInput onExtract={onExtract} autoStart />
      ) : (
        <button
          type="button"
          onClick={() => setVoiceOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 py-2.5 text-sm font-semibold text-red-700 active:scale-[0.99]"
        >
          <Sparkles className="h-4 w-4" /> Speak it / paste a list of tasks
        </button>
      )}

      {multi ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              AI found {multi.length} task{multi.length === 1 ? "" : "s"} — review &amp; create all
            </h2>
            <button
              type="button"
              onClick={() => setMulti(null)}
              className="text-xs font-semibold text-slate-400 underline"
            >
              Single form
            </button>
          </div>

          <div className="space-y-2">
            {multi.map((t, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 w-4 shrink-0 text-center text-xs font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <input
                    value={t.title ?? ""}
                    onChange={(e) => editField(i, { title: e.target.value })}
                    placeholder="Task title"
                    className="min-h-[40px] flex-1 rounded-lg border border-slate-200 px-2.5 text-sm font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => removeTask(i)}
                    aria-label="Remove task"
                    className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 active:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* editable: due date · assignee · category */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
                  <select
                    value={t.dueDate ?? todayIso}
                    onChange={(e) => editField(i, { dueDate: e.target.value })}
                    className={chipSelect}
                    aria-label="Due date"
                  >
                    {!DUE_OPTS.some((o) => o.value === (t.dueDate ?? todayIso)) && (
                      <option value={t.dueDate ?? ""}>{t.dueDate || "No date"}</option>
                    )}
                    {DUE_OPTS.map((o) => (
                      <option key={o.label} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={t.assignedToId ?? ""}
                    onChange={(e) => editField(i, { assignedToId: e.target.value || null })}
                    className={chipSelect}
                    aria-label="Assignee"
                  >
                    <option value="">Unassigned</option>
                    {assigneeOpts.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={t.type ?? "SOURCING"}
                    onChange={(e) => editField(i, { type: e.target.value })}
                    className={chipSelect}
                    aria-label="Category"
                  >
                    {TASK_TYPES.map((ty) => (
                      <option key={ty} value={ty}>{TASK_TYPE_LABELS[ty]}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={createAll}
            disabled={pending || !multi.length}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "Creating…" : `Create all ${multi.length} task${multi.length === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : (
        <TaskForm
          key={version}
          task={prefill}
          vendors={vendors}
          users={users}
          defaultVendorId={defaultVendorId}
          defaultAssigneeId={defaultAssigneeId}
          action={createTask}
          submitLabel="Create task"
          compact
        />
      )}
    </div>
  );
}
