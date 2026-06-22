// WhatsApp message template + helpers. Template is stored per-device in
// localStorage so it can be edited in /templates without a DB write.

export const WA_TEMPLATE_KEY = "prc_wa_template";

export const DEFAULT_WA_TEMPLATE =
  "Hi,\n\nthis is Varsa from PRC (pokketrccar.com) — the RC division of bharath cycle hub, 25-year-old business in the sports & cycling trade (bicycles, e-cycles, sports goods & accessories).\n\nFor the last 1.5 years we've been active in RC cars category and already sell a range of RC cars, drift cars, hobby grade RC cars, ride-ons and kids' toys across India.\n\nCould you please share your latest stock sheet with quantities and pricing? Happy to share our visiting card and GST details for your reference. Thank you!\n\nthese are our socials link.\nInstagram: https://www.instagram.com/164prccars\nYouTube: https://youtube.com/@164prccars";

export function getTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_WA_TEMPLATE;
  return localStorage.getItem(WA_TEMPLATE_KEY) || DEFAULT_WA_TEMPLATE;
}

export function setTemplate(value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WA_TEMPLATE_KEY, value);
}

// Build a tel: link from an Indian phone string like "+91-79428-43226".
// Returns a dialable number with country code so the OS dialer opens pre-filled.
export function buildTelLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `tel:+${full}`;
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
