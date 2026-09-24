"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getVerticals, VERTICAL_COOKIE } from "@/lib/vertical";

/** Switch the working vertical. Lands on the pending-to-connect list of the new vertical. */
export async function switchVertical(verticalId: string) {
  const verticals = await getVerticals();
  if (!verticals.some((v) => v.id === verticalId)) throw new Error("Unknown category");
  (await cookies()).set(VERTICAL_COOKIE, verticalId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    // Not a secret — a UI preference. Readable client-side so WhatsApp templates
    // and labels in client components follow the selected vertical.
    httpOnly: false,
  });
  revalidatePath("/", "layout");
  redirect("/vendors?status=NEW");
}
