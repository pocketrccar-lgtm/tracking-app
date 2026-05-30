"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim() || null;
  const color = String(fd.get("color") ?? "slate").trim();
  if (!name) throw new Error("Name required");
  await db.category.create({
    data: { name, slug: slugify(name), description, color },
  });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: string) {
  await db.category.delete({ where: { id } });
  revalidatePath("/categories");
}
