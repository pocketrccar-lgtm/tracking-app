"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const str = String(v).trim();
  return str === "" ? null : str;
}

// Touching a "pending to connect" (NEW) vendor in any meaningful way means we've
// started engaging it — so it auto-advances to CONTACTED and leaves the pending
// list. Returns { status: "CONTACTED" } to merge into an update only when the
// vendor is currently NEW; otherwise returns {} (leave its status alone).
async function contactBumpIfNew(id: string): Promise<{ status?: string }> {
  const v = await db.vendor.findUnique({ where: { id }, select: { status: true } });
  return v?.status === "NEW" ? { status: "CONTACTED" } : {};
}

function parsePhones(fd: FormData) {
  const phones = fd.getAll("phone").map(String);
  const labels = fd.getAll("phoneLabel").map(String);
  return phones
    .map((p, i) => ({ phone: p.trim(), label: labels[i]?.trim() || "main" }))
    .filter((p) => p.phone.length >= 4);
}

function parseEmails(fd: FormData) {
  const emails = fd.getAll("email").map(String);
  return emails
    .map((e) => ({ email: e.trim() }))
    .filter((e) => e.email.includes("@"));
}

function fromFormData(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    type: String(fd.get("type") ?? "WHOLESALER"),
    tier: String(fd.get("tier") ?? "T3_VERIFY_DRIFT"),
    status: String(fd.get("status") ?? "NEW"),
    state: s(fd.get("state")),
    city: s(fd.get("city")),
    address: s(fd.get("address")),
    gst: s(fd.get("gst")),
    cin: s(fd.get("cin")),
    driftStatus: String(fd.get("driftStatus") ?? "UNKNOWN"),
    bchRelevance: Math.max(0, Math.min(10, Number(fd.get("bchRelevance") ?? 0))),
    founderName: s(fd.get("founderName")),
    founderLinkedin: s(fd.get("founderLinkedin")),
    founderTitle: s(fd.get("founderTitle")),
    websiteUrl: s(fd.get("websiteUrl")),
    igHandle: s(fd.get("igHandle")),
    instagramUrl: s(fd.get("instagramUrl")),
    youtubeUrl: s(fd.get("youtubeUrl")),
    indiamartUrl: s(fd.get("indiamartUrl")),
    categoryId: s(fd.get("categoryId")),
    notes: s(fd.get("notes")),
    sourceMd: s(fd.get("sourceMd")),
    sourceUrl: s(fd.get("sourceUrl")),
  };
}

export async function createVendor(fd: FormData) {
  const data = fromFormData(fd);
  if (!data.name) throw new Error("Name required");
  const phones = parsePhones(fd);
  const emails = parseEmails(fd);

  const vendor = await db.vendor.create({
    data: {
      ...data,
      phones: { create: phones },
      emails: { create: emails },
    },
  });

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect(`/vendors/${vendor.id}`);
}

export async function updateVendor(id: string, fd: FormData) {
  const data = fromFormData(fd);
  if (!data.name) throw new Error("Name required");
  // Editing a still-NEW vendor counts as engaging it → advance to CONTACTED.
  if (data.status === "NEW") data.status = "CONTACTED";
  const phones = parsePhones(fd);
  const emails = parseEmails(fd);

  await db.$transaction([
    db.vendorPhone.deleteMany({ where: { vendorId: id } }),
    db.vendorEmail.deleteMany({ where: { vendorId: id } }),
    db.vendor.update({
      where: { id },
      data: {
        ...data,
        phones: { create: phones },
        emails: { create: emails },
      },
    }),
  ]);

  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  redirect(`/vendors/${id}`);
}

export async function deleteVendor(id: string) {
  await db.vendor.delete({ where: { id } });
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect("/vendors");
}

export async function updateVendorStatus(id: string, status: string) {
  // leaving the wrong-supplier state clears its reason
  await db.vendor.update({
    where: { id },
    data: { status, ...(status === "WRONG_SUPPLIER" ? {} : { wrongReason: null }) },
  });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

// Mark a vendor a wrong supplier with the reason (Wholesaler | Different category).
export async function markWrongSupplier(id: string, reason: string) {
  await db.vendor.update({
    where: { id },
    data: { status: "WRONG_SUPPLIER", wrongReason: reason || null },
  });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

export async function updateVendorTier(id: string, tier: string) {
  const bump = await contactBumpIfNew(id);
  await db.vendor.update({ where: { id }, data: { tier, ...bump } });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

export async function updateVendorType(id: string, type: string) {
  const bump = await contactBumpIfNew(id);
  await db.vendor.update({ where: { id }, data: { type, ...bump } });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}
