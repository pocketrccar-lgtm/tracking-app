import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_COLORS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/enums";

type KanbanTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  vendor: { id: string; name: string } | null;
  assignedTo: { name: string } | null;
  dueDate: Date | null;
};

const COLUMNS: { key: TaskStatus; bg: string }[] = [
  { key: "PENDING", bg: "bg-slate-50" },
  { key: "IN_PROGRESS", bg: "bg-blue-50" },
  { key: "COMPLETED", bg: "bg-emerald-50" },
  { key: "BLOCKED", bg: "bg-red-50" },
];

export function TaskKanban({ tasks }: { tasks: KanbanTask[] }) {
  const byStatus: Record<string, KanbanTask[]> = {};
  for (const t of tasks) {
    if (!byStatus[t.status]) byStatus[t.status] = [];
    byStatus[t.status].push(t);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = byStatus[col.key] ?? [];
        return (
          <div
            key={col.key}
            className={`rounded-lg border border-slate-200 ${col.bg} p-3 min-h-32`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {TASK_STATUS_LABELS[col.key]}
              </h3>
              <span className="text-xs text-slate-500">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-xs text-slate-400">No tasks</p>
              )}
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="block rounded-md bg-white p-2 shadow-sm hover:shadow active:bg-slate-50"
                >
                  <div className="text-sm font-medium text-slate-900 line-clamp-2">
                    {t.title}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${PRIORITY_COLORS[t.priority as TaskPriority] ?? ""}`}
                    >
                      {t.priority}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 truncate">
                    {t.vendor?.name ?? "No vendor"}
                  </div>
                  {t.assignedTo && (
                    <div className="mt-0.5 text-xs text-slate-400">
                      @{t.assignedTo.name}
                    </div>
                  )}
                  {t.dueDate && (
                    <div className="mt-0.5 text-xs text-slate-400">
                      due {new Date(t.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
