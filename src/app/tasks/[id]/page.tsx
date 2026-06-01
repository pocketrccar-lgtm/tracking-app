import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Phone, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskViewActions } from "@/components/task-view-actions";
import { WhatsAppButton } from "@/components/whatsapp-button";
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PRIORITY_COLORS,
  TASK_TYPE_LABELS,
  type TaskStatus,
  type TaskType,
  type TaskPriority,
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
  const task = await db.task.findUnique({
    where: { id },
    include: {
      vendor: { include: { phones: { take: 1 } } },
      assignedTo: true,
    },
  });
  if (!task) notFound();

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
          <Badge
            variant="outline"
            className={PRIORITY_COLORS[task.priority as TaskPriority] ?? ""}
          >
            {task.priority.toLowerCase()}
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-600">
            {TASK_TYPE_LABELS[task.type as TaskType] ?? task.type}
          </Badge>
        </div>
        <h1 className="mt-2.5 text-2xl font-bold leading-snug text-slate-900">
          {task.title}
        </h1>
        <div
          className={`mt-2 inline-flex items-center gap-1.5 text-sm font-semibold ${
            overdue ? "text-red-600" : "text-slate-500"
          }`}
        >
          <Calendar className="h-4 w-4" /> {dueLabel}
        </div>
      </div>

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

          {/* assignee */}
          <div className="flex items-center gap-3 p-4">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-sm text-slate-700">
              {task.assignedTo ? (
                <>
                  Assigned to{" "}
                  <span className="font-semibold text-slate-900">
                    {task.assignedTo.name}
                  </span>
                </>
              ) : (
                "Unassigned"
              )}
            </span>
          </div>

          {/* notes */}
          {task.notes && (
            <div className="p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notes
              </div>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {task.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskViewActions taskId={task.id} status={task.status} />
    </div>
  );
}
