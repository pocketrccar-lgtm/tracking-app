"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPlaybook(fd: FormData) {
  const title = String(fd.get("title") ?? "").trim();
  const kind = String(fd.get("kind") ?? "OTHER");
  const content = String(fd.get("content") ?? "").trim();
  const categoryId = String(fd.get("categoryId") ?? "") || null;
  if (!title) throw new Error("Title required");
  await db.playbook.create({ data: { title, kind, content, categoryId } });
  revalidatePath("/playbooks");
}

export async function updatePlaybook(id: string, fd: FormData) {
  const title = String(fd.get("title") ?? "").trim();
  const kind = String(fd.get("kind") ?? "OTHER");
  const content = String(fd.get("content") ?? "").trim();
  await db.playbook.update({ where: { id }, data: { title, kind, content } });
  revalidatePath("/playbooks");
}

export async function deletePlaybook(id: string) {
  await db.playbook.delete({ where: { id } });
  revalidatePath("/playbooks");
}
