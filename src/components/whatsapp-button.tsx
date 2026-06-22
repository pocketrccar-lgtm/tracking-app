"use client";

import { MessageCircle } from "lucide-react";
import { buildWaLink, buildWaBusinessLink } from "@/lib/whatsapp";
import { toast } from "sonner";

export function WhatsAppButton({
  phone,
  vendorName,
  variant = "icon",
}: {
  phone?: string | null;
  vendorName: string;
  variant?: "icon" | "full";
}) {
  if (!phone) return null;

  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // On Android, route to the WhatsApp Business app (com.whatsapp.w4b) via an
    // intent URL; it falls back to wa.me if Business isn't installed. Elsewhere
    // use the universal wa.me link.
    const isAndroid =
      typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
    const url = isAndroid
      ? buildWaBusinessLink(phone, vendorName)
      : buildWaLink(phone, vendorName);
    if (!url) {
      toast.error("No valid WhatsApp number");
      return;
    }
    if (isAndroid) {
      // intent:// URLs must navigate the current tab, not open a new window.
      window.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  };

  if (variant === "full") {
    return (
      <button
        onClick={open}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white active:scale-[0.97] transition-transform"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </button>
    );
  }

  return (
    <button
      onClick={open}
      aria-label={`WhatsApp ${vendorName}`}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 active:scale-90 transition-transform"
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  );
}
