"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const str = String(v).trim();
  return str === "" ? null : str;
}

function n(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}

function fromForm(fd: FormData) {
  return {
    vendorId: String(fd.get("vendorId") ?? ""),
    name: String(fd.get("name") ?? "").trim(),
    brand: s(fd.get("brand")),
    scale: s(fd.get("scale")),
    driftCapable: fd.get("driftCapable") === "on",
    ledLights: fd.get("ledLights") === "on",
    bodyShell: s(fd.get("bodyShell")),
    wholesalePrice: n(fd.get("wholesalePrice")),
    retailPrice: n(fd.get("retailPrice")),
    moq: n(fd.get("moq")),
    inStock: fd.get("inStock") !== null,
    notes: s(fd.get("notes")),
    categoryId: s(fd.get("categoryId")),
  };
}

export async function createProduct(fd: FormData) {
  const d = fromForm(fd);
  if (!d.vendorId) throw new Error("Vendor required");
  if (!d.name) throw new Error("Name required");

  const product = await db.product.create({
    data: {
      vendorId: d.vendorId,
      name: d.name,
      brand: d.brand,
      scale: d.scale,
      driftCapable: d.driftCapable,
      ledLights: d.ledLights,
      bodyShell: d.bodyShell,
      wholesalePrice: d.wholesalePrice,
      retailPrice: d.retailPrice,
      moq: d.moq ? Math.round(d.moq) : null,
      inStock: d.inStock,
      notes: d.notes,
      categoryId: d.categoryId,
      priceHistory: {
        create: {
          wholesalePrice: d.wholesalePrice,
          retailPrice: d.retailPrice,
          moq: d.moq ? Math.round(d.moq) : null,
          recordedBy: "system",
          notes: "Initial entry",
        },
      },
    },
  });
  revalidatePath("/products");
  revalidatePath(`/vendors/${d.vendorId}`);
  redirect(`/products/${product.id}`);
}

export async function updateProduct(id: string, fd: FormData) {
  const d = fromForm(fd);
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found");

  const priceChanged =
    existing.wholesalePrice !== d.wholesalePrice ||
    existing.retailPrice !== d.retailPrice ||
    existing.moq !== (d.moq ? Math.round(d.moq) : null);

  await db.product.update({
    where: { id },
    data: {
      name: d.name,
      brand: d.brand,
      scale: d.scale,
      driftCapable: d.driftCapable,
      ledLights: d.ledLights,
      bodyShell: d.bodyShell,
      wholesalePrice: d.wholesalePrice,
      retailPrice: d.retailPrice,
      moq: d.moq ? Math.round(d.moq) : null,
      inStock: d.inStock,
      notes: d.notes,
      categoryId: d.categoryId,
      ...(priceChanged
        ? {
            priceHistory: {
              create: {
                wholesalePrice: d.wholesalePrice,
                retailPrice: d.retailPrice,
                moq: d.moq ? Math.round(d.moq) : null,
                recordedBy: "system",
              },
            },
          }
        : {}),
    },
  });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath(`/vendors/${existing.vendorId}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  const p = await db.product.findUnique({ where: { id } });
  await db.product.delete({ where: { id } });
  if (p) {
    revalidatePath(`/vendors/${p.vendorId}`);
  }
  revalidatePath("/products");
  redirect("/products");
}
