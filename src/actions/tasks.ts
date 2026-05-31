"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    notes: s(fd.get("notes")),
  };
}

export async function createTask(fd: FormData) {
  const d = fromForm(fd);
  if (!d.title) throw new Error("Title required");
  await db.task.create({
    data: {
      vendorId: d.vendorId || null,
      title: d.title,
      description: d.description,
      type: d.type,
      priority: d.priority,
      status: d.status,
      assignedToId: d.assignedToId,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      notes: d.notes,
    },
  });
  revalidatePath("/tasks");
  if (d.vendorId) revalidatePath(`/vendors/${d.vendorId}`);
  redirect("/tasks");
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
      notes: d.notes,
      completedAt: d.status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath(`/vendors/${d.vendorId}`);
  redirect(`/tasks/${id}`);
}

export async function updateTaskStatus(id: string, status: string) {
  await db.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
}
