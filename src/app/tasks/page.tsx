import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  TASK_STATUS_COLORS,
  PRIORITY_COLORS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
  type TaskStatus,
  type TaskType,
  type TaskPriority,
} from "@/lib/enums";
import { formatDistanceToNow } from "date-fns";
import { TaskKanban } from "@/components/task-kanban";
import { ChevronRight, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "kanban" ? "kanban" : "list";

  const where: Record<string, unknown> = {};
  if (params.status && view === "list") where.status = params.status;

  const [tasks, counts] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: 200,
      include: { vendor: true, assignedTo: true },
    }),
    db.task.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold min-h-[44px] inline-flex items-center whitespace-nowrap ${
      active
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300"
    }`;

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.length} shown`}
        action={
          <Link href="/tasks/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" /> New
          </Link>
        }
      />
      <div className="px-4 pt-5 pb-28 space-y-4">
        {/* view toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-gray-800 p-1">
          <Link
            href="/tasks"
            className={`flex-1 rounded-lg py-2 min-h-[44px] flex items-center justify-center text-xs font-bold transition-all ${view === "list" ? "bg-white dark:bg-gray-900 shadow-sm" : "text-slate-400"}`}
          >
            List
          </Link>
          <Link
            href="/tasks?view=kanban"
            className={`flex-1 rounded-lg py-2 min-h-[44px] flex items-center justify-center text-xs font-bold transition-all ${view === "kanban" ? "bg-white dark:bg-gray-900 shadow-sm" : "text-slate-400"}`}
          >
            Kanban
          </Link>
        </div>

        {view === "list" && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <Link href="/tasks" className={chip(!params.status)}>
              All
            </Link>
            {(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"] as const).map((s) => {
              const count = counts.find((c) => c.status === s)?._count._all ?? 0;
              return (
                <Link key={s} href={`/tasks?status=${s}`} className={chip(params.status === s)}>
                  {TASK_STATUS_LABELS[s]} ({count})
                </Link>
              );
            })}
          </div>
        )}

        {view === "kanban" ? (
          <TaskKanban tasks={tasks} />
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-slate-500 dark:text-gray-400">
              No tasks yet.{" "}
              <Link href="/tasks/new" className="text-amber-600 underline">
                Create one
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="block rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-gray-100">
                      {t.title}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-gray-400">
                      {t.vendor.name}
                      {t.assignedTo ? ` · @${t.assignedTo.name}` : ""}
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-gray-600" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={TASK_STATUS_COLORS[t.status as TaskStatus] ?? ""}>
                    {TASK_STATUS_LABELS[t.status as TaskStatus] ?? t.status}
                  </Badge>
                  <Badge variant="outline" className={PRIORITY_COLORS[t.priority as TaskPriority] ?? ""}>
                    {t.priority.toLowerCase()}
                  </Badge>
                  <Badge variant="outline">
                    {TASK_TYPE_LABELS[t.type as TaskType] ?? t.type}
                  </Badge>
                  <span className="ml-auto text-xs text-slate-400 dark:text-gray-500">
                    {formatDistanceToNow(t.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
