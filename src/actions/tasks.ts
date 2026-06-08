"use server";

import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { TASKS_TAG } from "@/lib/task-cache";

// Bust every cached task read (cached list rows + detail ISR) after a write.
// Next 16: revalidateTag needs a cache-life profile; "max" == the old one-arg behaviour.
function bustTasks(id?: string) {
  revalidateTag(TASKS_TAG, "max");
  revalidatePath("/tasks");
  if (id) revalidatePath(`/tasks/${id}`);
}

function s(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const str = String(v).trim();
  return str === "" ? null : str;
}

function fromForm(fd: FormData) {
  return {
    vendorId: String(fd.get("vendorId") ?? ""),
    title: String(fd.get("title") ?? "").trim(),
    description: s(fd.get("description")),
    type: String(fd.get("type") ?? "CALL"),
    priority: String(fd.get("priority") ?? "MEDIUM"),
    status: String(fd.get("status") ?? "PENDING"),
    assignedToId: s(fd.get("assignedToId")),
    dueDate: s(fd.get("dueDate")),
    effortDays: Math.max(1, Math.min(30, Math.round(Number(fd.get("effortDays") ?? 1)) || 1)),
    phase: s(fd.get("phase")),
    notes: s(fd.get("notes")),
  };
}

export async function createTask(fd: FormData) {
  const d = fromForm(fd);
  if (!d.title) throw new Error("Title required");
  const task = await db.task.create({
    data: {
      vendorId: d.vendorId || null,
      title: d.title,
      description: d.description,
      type: d.type,
      priority: d.priority,
      status: d.status,
      assignedToId: d.assignedToId,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      effortDays: d.effortDays,
      phase: d.phase,
      notes: d.notes,
    },
  });
  bustTasks();
  if (d.vendorId) revalidatePath(`/vendors/${d.vendorId}`);
  redirect(`/tasks?created=${task.id}`);
}

// Bulk-create from one AI-parsed note that contained several tasks.
export type NewTaskInput = {
  title: string;
  type?: string;
  priority?: string;
  assignedToId?: string | null;
  dueDate?: string | null;
  vendorId?: string | null;
  notes?: string | null;
  phase?: string | null;
};

export async function createTasks(tasks: NewTaskInput[]) {
  const clean = (tasks ?? []).filter((t) => t?.title?.trim());
  if (!clean.length) throw new Error("No tasks to create");
  // create one-by-one so we get each new id (for the confirmation popup)
  const ids: string[] = [];
  for (const t of clean) {
    const created = await db.task.create({
      data: {
        title: t.title.trim(),
        type: t.type || "SOURCING",
        priority: t.priority || "MEDIUM",
        status: "PENDING",
        assignedToId: t.assignedToId || null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        vendorId: t.vendorId || null,
        phase: t.phase || null,
        notes: t.notes || null,
      },
    });
    ids.push(created.id);
  }
  bustTasks();
  redirect(`/tasks?created=${ids.join(",")}`);
}

export async function updateTask(id: string, fd: FormData) {
  const d = fromForm(fd);
  await db.task.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      type: d.type,
      priority: d.priority,
      status: d.status,
      assignedToId: d.assignedToId,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      effortDays: d.effortDays,
      phase: d.phase,
      notes: d.notes,
      completedAt: d.status === "COMPLETED" ? new Date() : null,
    },
  });
  bustTasks(id);
  revalidatePath(`/vendors/${d.vendorId}`);
  redirect(`/tasks/${id}`);
}

export async function setTaskPhase(id: string, phase: string) {
  await db.task.update({ where: { id }, data: { phase: phase || null } });
  bustTasks(id);
}

export async function updateTaskStatus(id: string, status: string) {
  await db.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  bustTasks(id);
}

// Push the due date out by N days (from the current due date, or today).
export async function snoozeTask(id: string, days: number) {
  const task = await db.task.findUnique({ where: { id }, select: { dueDate: true } });
  const base = task?.dueDate ? new Date(task.dueDate) : new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + days);
  await db.task.update({ where: { id }, data: { dueDate: base } });
  bustTasks(id);
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  bustTasks();
  redirect("/tasks");
}

// Inline delete from the list — no redirect, just drop the row.
export async function removeTask(id: string) {
  await db.task.delete({ where: { id } });
  bustTasks();
}

// ─── Inline field edits (tap-to-edit on the task detail page) ────────────────
export async function setTaskTitle(id: string, title: string) {
  const t = title.trim();
  if (!t) return;
  await db.task.update({ where: { id }, data: { title: t } });
  bustTasks(id);
}

export async function setTaskNotes(id: string, notes: string) {
  await db.task.update({ where: { id }, data: { notes: notes.trim() || null } });
  bustTasks(id);
}

export async function setTaskAssignee(id: string, assignedToId: string | null) {
  await db.task.update({ where: { id }, data: { assignedToId: assignedToId || null } });
  bustTasks(id);
}

// "Done when" lives inside description as a "DONE-WHEN: …" marker.
export async function setTaskDoneWhen(id: string, text: string) {
  const t = await db.task.findUnique({ where: { id }, select: { description: true } });
  const body = (t?.description ?? "").replace(/\s*DONE-WHEN:\s*[^]*$/i, "").trimEnd();
  const clean = text.trim();
  const description = clean
    ? body
      ? `${body}\n\nDONE-WHEN: ${clean}`
      : `DONE-WHEN: ${clean}`
    : body || null;
  await db.task.update({ where: { id }, data: { description } });
  bustTasks(id);
}
