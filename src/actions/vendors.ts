"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const phoneSchema = z.object({
  phone: z.string().min(4),
  label: z.string().optional().nullable(),
});

const emailSchema = z.object({
  email: z.string().email(),
  label: z.string().optional().nullable(),
});

const vendorInputSchema = z.object({
  name: z.string().min(1, "Name required"),
  type: z.string().min(1),
  tier: z.string().min(1),
  status: z.string().default("COLD"),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  driftStatus: z.string().default("UNKNOWN"),
  bchRelevance: z.coerce.number().int().min(0).max(10).default(0),
  founderName: z.string().optional().nullable(),
  founderLinkedin: z.string().optional().nullable(),
  founderTitle: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  igHandle: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sourceMd: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  phones: z.array(phoneSchema).default([]),
  emails: z.array(emailSchema).default([]),
});

export type VendorInput = z.infer<typeof vendorInputSchema>;

function cleanNullable<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined) out[k] = null;
    else out[k] = v;
  }
  return out as T;
}

export async function createVendor(rawInput: VendorInput) {
  const parsed = vendorInputSchema.parse(rawInput);
  const { phones, emails, ...rest } = parsed;
  const cleaned = cleanNullable(rest);

  const vendor = await db.vendor.create({
    data: {
      ...cleaned,
      phones: { create: phones.filter((p) => p.phone.trim()) },
      emails: { create: emails.filter((e) => e.email.trim()) },
    },
  });

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect(`/vendors/${vendor.id}`);
}

export async function updateVendor(id: string, rawInput: VendorInput) {
  const parsed = vendorInputSchema.parse(rawInput);
  const { phones, emails, ...rest } = parsed;
  const cleaned = cleanNullable(rest);

  await db.$transaction([
    db.vendorPhone.deleteMany({ where: { vendorId: id } }),
    db.vendorEmail.deleteMany({ where: { vendorId: id } }),
    db.vendor.update({
      where: { id },
      data: {
        ...cleaned,
        phones: { create: phones.filter((p) => p.phone.trim()) },
        emails: { create: emails.filter((e) => e.email.trim()) },
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
