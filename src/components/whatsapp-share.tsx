"use client";

import { MessageCircle } from "lucide-react";

/**
 * Opens WhatsApp with a pre-filled message of one person's tasks so you can
 * pick their chat and delegate the whole list in one tap. wa.me with no number
 * lets the sender choose the recipient; if a phone is known we target it directly.
 */
export function WhatsAppShare({
  text,
  name,
  count,
  phone,
}: {
  text: string;
  name: string;
  count: number;
  phone?: string | null;
}) {
  const share = () => {
    const digits = (phone ?? "").replace(/\D/g, "");
    const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(text)}`, "_blank");
  };
  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99] transition-transform"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
      Send {name}&apos;s {count} task{count === 1 ? "" : "s"} on WhatsApp
    </button>
  );
}
