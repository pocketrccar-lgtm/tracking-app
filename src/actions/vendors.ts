"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const str = String(v).trim();
  return str === "" ? null : str;
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
    status: String(fd.get("status") ?? "COLD"),
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
  await db.vendor.update({
    where: { id },
    data: { status },
  });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
}
