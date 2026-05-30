// WhatsApp message template + helpers. Template is stored per-device in
// localStorage so it can be edited in /templates without a DB write.

export const WA_TEMPLATE_KEY = "prc_wa_template";

export const DEFAULT_WA_TEMPLATE =
  "Hi {vendor}, this is Pocket RC Cars (pokketrccar.com). We run a wholesale RC car business in India and are sourcing drift RC cars (1:18 / 1:24 scale). Could you please share your latest catalogue and wholesale pricing + MOQ? Thank you.";

export function getTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_WA_TEMPLATE;
  return localStorage.getItem(WA_TEMPLATE_KEY) || DEFAULT_WA_TEMPLATE;
}

export function setTemplate(value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WA_TEMPLATE_KEY, value);
}

// Build a wa.me link from an Indian phone string like "+91-79428-43226".
export function buildWaLink(phone: string, vendorName: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // ensure country code; assume India if 10 digits
  const full = digits.length === 10 ? `91${digits}` : digits;
  const msg = getTemplate().replaceAll("{vendor}", vendorName || "there");
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}
