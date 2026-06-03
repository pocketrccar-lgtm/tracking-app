import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Phone, ShoppingBag, Key, Target, CircleDot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskViewActions } from "@/components/task-view-actions";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { InlineEditText } from "@/components/inline-edit-text";
import { InlineAssignee } from "@/components/inline-assignee";
import {
  setTaskTitle,
  setTaskNotes,
  setTaskAssignee,
  setTaskDoneWhen,
} from "@/actions/tasks";
import {
  buildGraph,
  doneWhen as parseDoneWhen,
  phaseForTask,
  PHASE_LABEL,
  type RoadmapTask,
} from "@/lib/roadmap";
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
  type TaskStatus,
  type TaskType,
} from "@/lib/enums";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function TaskViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, allTasks, users] = await Promise.all([
    db.task.findUnique({
      where: { id },
      include: {
        vendor: { include: { phones: { take: 1 } } },
        assignedTo: true,
      },
    }),
    db.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        effortDays: true,
        type: true,
        phase: true,
        notes: true,
        description: true,
      },
    }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!task) notFound();

  // dependency graph → what finishing this task unlocks / what it waits on
  const graph = buildGraph(allTasks as RoadmapTask[]);
  const unlocksCount = graph.unlocks.get(task.id) ?? 0;
  const openBlockers = (graph.blockers.get(task.id) ?? []).filter(
    (b) => b.status !== "COMPLETED",
  );
  const dw = parseDoneWhen(task);

  let dueLabel = "No due date";
  let overdue = false;
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    const diff = Math.round(
      (Date.parse(isoDate(d)) - Date.parse(isoDate(new Date()))) / 86400000,
    );
    overdue = diff < 0 && task.status !== "COMPLETED";
    dueLabel =
      diff === 0
        ? "Due today"
        : diff === 1
          ? "Due tomorrow"
          : diff === -1
            ? "1 day overdue"
            : diff < 0
              ? `${-diff} days overdue`
              : `Due ${format(d, "EEE d MMM")}`;
  }

  const phone = task.vendor?.phones[0]?.phone ?? null;

  return (
    <div className="px-4 pt-5 pb-36 space-y-5">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
      </Link>

      {/* hero */}
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={TASK_STATUS_COLORS[task.status as TaskStatus] ?? ""}
          >
            {TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {PHASE_LABEL[phaseForTask(task)] ?? "Stage"}
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-600">
            {TASK_TYPE_LABELS[task.type as TaskType] ?? task.type}
          </Badge>
        </div>
        <div className="mt-2.5">
          <InlineEditText
            initial={task.title}
            placeholder="Task title"
            singleLine
            save={setTaskTitle.bind(null, task.id)}
            displayClassName="text-2xl font-bold leading-snug text-slate-900"
          />
        </div>
        <div
          className={`mt-2 inline-flex items-center gap-1.5 text-sm font-semibold ${
            overdue ? "text-red-600" : "text-slate-500"
          }`}
        >
          <Calendar className="h-4 w-4" /> {dueLabel}
        </div>
      </div>

      {/* why this matters — goal impact */}
      <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <Target className="h-3.5 w-3.5" /> Why this matters
            </div>

            {unlocksCount > 0 ? (
              <div className="flex items-start gap-2 rounded-xl bg-teal-50 p-3">
                <Key className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <p className="text-sm font-semibold text-teal-900">
                  Finishing this unlocks {unlocksCount} task
                  {unlocksCount === 1 ? "" : "s"} and moves ₹30L one step closer.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                A leaf task — completing it directly burns down the roadmap toward ₹30L.
              </p>
            )}

            <div>
              <div className="mb-0.5 text-xs font-semibold text-slate-400">
                Done when
              </div>
              <InlineEditText
                initial={dw ?? ""}
                placeholder="Define what 'done' looks like…"
                emptyLabel="Tap to add a 'done when' definition"
                save={setTaskDoneWhen.bind(null, task.id)}
                displayClassName="text-sm text-slate-700"
              />
            </div>

            {openBlockers.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <CircleDot className="h-3.5 w-3.5" /> Waiting on{" "}
                  {openBlockers.length} task{openBlockers.length === 1 ? "" : "s"}
                </div>
                <ul className="space-y-1">
                  {openBlockers.slice(0, 4).map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/tasks/${b.id}`}
                        className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
                      >
                        {b.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

      {/* meta */}
      <Card>
        <CardContent className="divide-y divide-slate-100 p-0">
          {/* vendor */}
          <div className="flex items-center gap-3 p-4">
            <ShoppingBag className="h-4 w-4 shrink-0 text-slate-400" />
            {task.vendor ? (
              <>
                <Link
                  href={`/vendors/${task.vendor.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900"
                >
                  {task.vendor.name}
                </Link>
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    aria-label="Call"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                <WhatsAppButton phone={phone} vendorName={task.vendor.name} />
              </>
            ) : (
              <span className="text-sm text-slate-400">No vendor</span>
            )}
          </div>

          {/* assignee — tap to reassign */}
          <InlineAssignee
            current={task.assignedTo ? { id: task.assignedTo.id, name: task.assignedTo.name } : null}
            users={users}
            save={setTaskAssignee.bind(null, task.id)}
          />

          {/* notes — tap to edit */}
          <div className="p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Notes
            </div>
            <InlineEditText
              initial={task.notes ?? ""}
              placeholder="Add notes…"
              emptyLabel="Tap to add notes"
              save={setTaskNotes.bind(null, task.id)}
              displayClassName="text-sm text-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      <TaskViewActions taskId={task.id} status={task.status} />
    </div>
  );
}
