"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const taskInputSchema = z.object({
  vendorId: z.string().min(1),
  title: z.string().min(1, "Title required"),
  description: z.string().optional().nullable(),
  type: z.string().default("CALL"),
  priority: z.string().default("MEDIUM"),
  status: z.string().default("PENDING"),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export async function createTask(input: TaskInput) {
  const data = taskInputSchema.parse(input);
  const task = await db.task.create({
    data: {
      vendorId: data.vendorId,
      title: data.title,
      description: data.description || null,
      type: data.type,
      priority: data.priority,
      status: data.status,
      assignedToId: data.assignedToId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath(`/vendors/${data.vendorId}`);
  redirect(`/vendors/${data.vendorId}`);
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
