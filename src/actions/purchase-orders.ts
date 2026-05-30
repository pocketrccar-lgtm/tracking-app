"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const str = String(v).trim();
  return str === "" ? null : str;
}

function n(v: FormDataEntryValue | null): number {
  return Number(v ?? 0) || 0;
}

export async function createPurchaseOrder(fd: FormData) {
  const vendorId = String(fd.get("vendorId") ?? "");
  const productId = s(fd.get("productId"));
  const quantity = Math.max(1, Math.round(n(fd.get("quantity"))));
  const unitCost = n(fd.get("unitCost"));
  const status = String(fd.get("status") ?? "SAMPLE");
  const notes = s(fd.get("notes"));

  if (!vendorId) throw new Error("Vendor required");

  const po = await db.purchaseOrder.create({
    data: {
      vendorId,
      productId,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      status,
      notes,
    },
  });
  revalidatePath("/purchase-orders");
  revalidatePath(`/vendors/${vendorId}`);
  if (productId) revalidatePath(`/products/${productId}`);
  redirect(`/purchase-orders/${po.id}`);
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const po = await db.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Not found");
  await db.purchaseOrder.update({
    where: { id },
    data: {
      status,
      receivedAt: status === "RECEIVED" || status === "QA_PASSED" ? new Date() : po.receivedAt,
    },
  });
  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath(`/vendors/${po.vendorId}`);
}

export async function updatePurchaseOrder(id: string, fd: FormData) {
  const quantity = Math.max(1, Math.round(n(fd.get("quantity"))));
  const unitCost = n(fd.get("unitCost"));
  const status = String(fd.get("status") ?? "SAMPLE");
  const notes = s(fd.get("notes"));

  const po = await db.purchaseOrder.update({
    where: { id },
    data: {
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      status,
      notes,
    },
  });
  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath(`/vendors/${po.vendorId}`);
  redirect(`/purchase-orders/${id}`);
}
