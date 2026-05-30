import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    db.task.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">
            {tasks.length} task{tasks.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tasks/new"
            className={buttonVariants()}
          >
            New task
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/tasks${view === "kanban" ? "?view=kanban" : ""}`}
            className={`rounded-full px-3 py-1 text-xs ${!params.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </Link>
          {(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"] as const).map(
            (s) => {
              const count = counts.find((c) => c.status === s)?._count._all ?? 0;
              return (
                <Link
                  key={s}
                  href={`/tasks?status=${s}`}
                  className={`rounded-full px-3 py-1 text-xs ${params.status === s ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {TASK_STATUS_LABELS[s]} ({count})
                </Link>
              );
            },
          )}
        </div>
        <div className="flex gap-1 rounded-md bg-slate-100 p-0.5">
          <Link
            href="/tasks"
            className={`rounded px-3 py-1 text-xs ${view === "list" ? "bg-white shadow-sm" : "text-slate-600"}`}
          >
            List
          </Link>
          <Link
            href="/tasks?view=kanban"
            className={`rounded px-3 py-1 text-xs ${view === "kanban" ? "bg-white shadow-sm" : "text-slate-600"}`}
          >
            Kanban
          </Link>
        </div>
      </div>

      {view === "kanban" ? (
        <TaskKanban tasks={tasks} />
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-slate-500">
            No tasks yet.{" "}
            <Link href="/tasks/new" className="text-emerald-600 underline">
              Create one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Updated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <Link href={`/tasks/${t.id}`} className="hover:text-emerald-600">
                      <div className="truncate max-w-xs">{t.title}</div>
                    </Link>
                    {t.assignedTo && (
                      <div className="text-xs text-slate-500">
                        @{t.assignedTo.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/vendors/${t.vendor.id}`}
                      className="text-xs hover:text-emerald-600"
                    >
                      {t.vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    {TASK_TYPE_LABELS[t.type as TaskType] ?? t.type}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PRIORITY_COLORS[t.priority as TaskPriority] ?? ""}
                    >
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={TASK_STATUS_COLORS[t.status as TaskStatus] ?? ""}
                    >
                      {TASK_STATUS_LABELS[t.status as TaskStatus] ?? t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right text-xs text-slate-500">
                    {formatDistanceToNow(t.updatedAt, { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
