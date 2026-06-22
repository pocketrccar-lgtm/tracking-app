"use client";

import { Phone } from "lucide-react";
import { buildTelLink } from "@/lib/whatsapp";
import { toast } from "sonner";

export function CallButton({
  phone,
  vendorName,
  variant = "icon",
}: {
  phone?: string | null;
  vendorName: string;
  variant?: "icon" | "full";
}) {
  if (!phone) return null;

  const call = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = buildTelLink(phone);
    if (!url) {
      toast.error("No valid phone number");
      return;
    }
    window.location.href = url;
  };

  if (variant === "full") {
    return (
      <button
        onClick={call}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white active:scale-[0.97] transition-transform"
      >
        <Phone className="h-4 w-4" /> Call
      </button>
    );
  }

  return (
    <button
      onClick={call}
      aria-label={`Call ${vendorName}`}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 active:scale-90 transition-transform"
    >
      <Phone className="h-5 w-5" />
    </button>
  );
}
