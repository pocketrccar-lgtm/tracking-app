// WhatsApp message template + helpers. Template is stored per-device in
// localStorage so it can be edited in /templates without a DB write.

import { currentVerticalIdClient } from "@/lib/vertical-labels";

export const WA_TEMPLATE_KEY = "prc_wa_template";

export const DEFAULT_WA_TEMPLATE =
  "Hi,\n\nthis is Varsa from PRC (pocketrccars.com) — the RC division of bharath cycle hub, 25-year-old business in the sports & cycling trade (bicycles, e-cycles, sports goods & accessories).\n\nFor the last 1.5 years we've been active in RC cars category and already sell a range of RC cars, drift cars, hobby grade RC cars, ride-ons and kids' toys across India.\n\nCould you please share your latest stock sheet with quantities and pricing? Happy to share our visiting card and GST details for your reference. Thank you!\n\nthese are our socials link.\nInstagram: https://www.instagram.com/164prccars\nYouTube: https://youtube.com/@164prccars";

// Outreach text differs per vertical (an RC pitch must never go to an EV maker).
export const EV_WA_TEMPLATE =
  "Hi {vendor},\n\nThis is from Bharath Cycle Hub, Bengaluru — a 25-year-old business in the sports & cycling trade (bicycles, e-cycles, sports goods & accessories).\n\nWe are adding low-speed electric scooters (non-RTO, ≤25 km/h, ≤250 W) and would like to become a dealer / distributor for your range.\n\nCould you please share your dealer price list, dealer margin, MOQ, and the motor wattage / non-RTO certificate for each model? Happy to share our GST details for your reference. Thank you!";

export const BATTERY_WA_TEMPLATE =
  "Hi {vendor},\n\nThis is from Bharath Cycle Hub, Bengaluru — a 25-year-old business in the sports & cycling trade (bicycles, e-cycles, sports goods & accessories).\n\nWe are sourcing batteries for our e-cycles (36V / 48V) and low-speed e-scooters (48V / 60V) — lithium (Li-ion / LFP) packs, and lead-acid where it fits.\n\nCould you please share your price list, MOQ, cell / plate specifications, BMS details (for lithium), warranty, and your AIS-156 / BIS certificate? Happy to share our GST details for your reference. Thank you!";

const DEFAULTS: Record<string, string> = {
  "pocket-rc": DEFAULT_WA_TEMPLATE,
  "ev-scooters": EV_WA_TEMPLATE,
  "ev-batteries": BATTERY_WA_TEMPLATE,
};

/** Default outreach text for a vertical. */
export function defaultTemplateFor(verticalId: string = currentVerticalIdClient()): string {
  return DEFAULTS[verticalId] ?? DEFAULT_WA_TEMPLATE;
}

// Pocket RC keeps the original key so templates already edited on devices survive.
function keyFor(verticalId: string): string {
  return verticalId === "pocket-rc" ? WA_TEMPLATE_KEY : `${WA_TEMPLATE_KEY}:${verticalId}`;
}

export function getTemplate(verticalId: string = currentVerticalIdClient()): string {
  if (typeof window === "undefined") return defaultTemplateFor(verticalId);
  return localStorage.getItem(keyFor(verticalId)) || defaultTemplateFor(verticalId);
}

export function setTemplate(value: string, verticalId: string = currentVerticalIdClient()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyFor(verticalId), value);
}

// Build a tel: link from an Indian phone string like "+91-79428-43226".
// Returns a dialable number with country code so the OS dialer opens pre-filled.
export function buildTelLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `tel:+${full}`;
}

// Normalize an Indian phone string like "+91-79428-43226" to digits with
// country code. Returns null if it doesn't look like a real number.
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // ensure country code; assume India if 10 digits
  return digits.length === 10 ? `91${digits}` : digits;
}

function buildWaText(vendorName: string): string {
  return getTemplate().replaceAll("{vendor}", vendorName || "there");
}

// Build a wa.me link from an Indian phone string like "+91-79428-43226".
// Universal link — opens whichever WhatsApp app is the device default.
export function buildWaLink(phone: string, vendorName: string): string | null {
  const full = normalizePhone(phone);
  if (!full) return null;
  const msg = buildWaText(vendorName);
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

// Build an Android intent URL that targets the WhatsApp Business app
// (package com.whatsapp.w4b) specifically, rather than regular WhatsApp.
// Falls back to the wa.me link if the Business app isn't installed.
export function buildWaBusinessLink(
  phone: string,
  vendorName: string,
): string | null {
  const full = normalizePhone(phone);
  if (!full) return null;
  const msg = encodeURIComponent(buildWaText(vendorName));
  const fallback = encodeURIComponent(
    `https://wa.me/${full}?text=${msg}`,
  );
  return (
    `intent://send?phone=${full}&text=${msg}` +
    `#Intent;scheme=whatsapp;package=com.whatsapp.w4b;` +
    `S.browser_fallback_url=${fallback};end`
  );
}
