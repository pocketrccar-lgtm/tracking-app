import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { updateTask } from "@/actions/tasks";
import { TaskForm } from "@/components/task-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, vendors, users] = await Promise.all([
    db.task.findUnique({ where: { id }, include: { vendor: true } }),
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!task) notFound();

  const action = updateTask.bind(null, id);

  return (
    <div className="space-y-4">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Edit task</h1>
      <p className="text-sm text-slate-500">
        Vendor: <Link href={`/vendors/${task.vendor.id}`} className="text-emerald-600 underline">{task.vendor.name}</Link>
      </p>
      <TaskForm
        task={task}
        vendors={vendors}
        users={users}
        action={action}
        submitLabel="Save"
      />
    </div>
  );
}
