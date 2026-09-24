"use server";

import { vdb, assertInVertical } from "@/lib/vertical";
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
  const db = await vdb();
  const v = await db.vendor.findUnique({ where: { id }, select: { status: true } });
  return v?.status === "NEW" ? { status: "CONTACTED" } : {};
}

function parsePhones(fd: FormData) {
  const phones = fd.getAll("phone").map(String);
  const labels = fd.getAll("phoneLabel").map(String);
  return phones
    .map((p, i) => ({ phone: p.trim(), label: labels[i]?.trim() || "main", verified: false }))
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
  const db = await vdb();
  const data = fromFormData(fd);
  if (!data.name) throw new Error("Name required");
  await assertInVertical(db, { categoryId: data.categoryId });
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
  const db = await vdb();
  const data = fromFormData(fd);
  if (!data.name) throw new Error("Name required");
  // Editing a still-NEW vendor counts as engaging it → advance to CONTACTED.
  if (data.status === "NEW") data.status = "CONTACTED";
  await assertInVertical(db, { categoryId: data.categoryId });
  // The edit form rebuilds the phone list; carry over the verified flag of any
  // number that was verified before, so the verified sales line stays first.
  const before = await db.vendor.findUnique({ where: { id }, select: { phones: { select: { phone: true, verified: true } } } });
  const digits = (p: string) => p.replace(/\D/g, "").slice(-10);
  const wasVerified = new Set((before?.phones ?? []).filter((p) => p.verified).map((p) => digits(p.phone)));
  const phones = parsePhones(fd).map((p) => ({ ...p, verified: wasVerified.has(digits(p.phone)) }));
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
  const db = await vdb();
  await db.vendor.delete({ where: { id } });
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect("/vendors");
}

export async function updateVendorStatus(id: string, status: string) {
  const db = await vdb();
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
  const db = await vdb();
  await db.vendor.update({
    where: { id },
    data: { status: "WRONG_SUPPLIER", wrongReason: reason || null },
  });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

export async function updateVendorTier(id: string, tier: string) {
  const db = await vdb();
  const bump = await contactBumpIfNew(id);
  await db.vendor.update({ where: { id }, data: { tier, ...bump } });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

export async function updateVendorType(id: string, type: string) {
  const db = await vdb();
  const bump = await contactBumpIfNew(id);
  await db.vendor.update({ where: { id }, data: { type, ...bump } });
  revalidatePath(`/vendors/${id}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}

// One-tap call outcome from the vendor screen. Logs the call in the vendor's
// history and moves its status:
//   NO_ANSWER → status unchanged (stays pending; the attempt is counted)
//   QUALITY   → NEW becomes CONTACTED (a real conversation happened)
//   WASTE     → Lost lead, reason "Waste lead"
export async function logCallOutcome(vendorId: string, outcome: string) {
  if (!["NO_ANSWER", "QUALITY", "WASTE"].includes(outcome)) throw new Error("Unknown outcome");
  const db = await vdb();
  // Scoped lookup — a vendor from another category is "not found".
  const vendor = await db.vendor.findUnique({ where: { id: vendorId }, select: { status: true } });
  if (!vendor) throw new Error("Vendor not found in this category");
  // The app has no login yet; calls are attributed to the shared partner account.
  const author =
    (await db.user.findFirst({ where: { name: { startsWith: "Shared" } } })) ??
    (await db.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!author) throw new Error("No user to attribute the call to");

  const label = { NO_ANSWER: "No answer", QUALITY: "Quality lead", WASTE: "Waste lead" }[outcome];
  const statusChange =
    outcome === "QUALITY"
      ? vendor.status === "NEW" ? { status: "CONTACTED" } : {}
      : outcome === "WASTE"
        ? { status: "WRONG_SUPPLIER", wrongReason: "WASTE_LEAD" }
        : {};

  await db.$transaction([
    db.interaction.create({
      data: { vendorId, userId: author.id, type: "CALL", outcome, notes: label },
    }),
    // Always touch the vendor so "Updated" reflects the call; merge any status change.
    db.vendor.update({ where: { id: vendorId }, data: { ...statusChange, updatedAt: new Date() } }),
  ]);

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
}
