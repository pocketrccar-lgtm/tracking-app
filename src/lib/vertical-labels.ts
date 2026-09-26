// Per-vertical wording for the vendor fields every vertical shares.
// Client-safe (no server imports). The stored values stay the same across
// verticals; only what they are CALLED changes (RC "Drift" = EV "Non-RTO").

import type { DriftStatus, MarketLevel, VendorTier } from "@/lib/enums";

export const VERTICAL_COOKIE_NAME = "sourcing_vertical";
export const DEFAULT_VERTICAL_ID = "pocket-rc";

export type VerticalLabels = {
  /** Name of the product-fit signal stored in `driftStatus`. */
  fitName: string;
  fit: Record<DriftStatus, string>;
  /** Short chips shown in lists for the two positive fit states. */
  fitChipConfirmed: string;
  fitChipLikely: string;
  /** Dashboard card title for confirmed fit. */
  fitConfirmedCard: string;
  tier: Record<VendorTier, string>;
  marketName: string;
  market: Record<MarketLevel, string>;
  /** Short market chip used on mobile cards. */
  marketShort: Record<MarketLevel, string>;
  /** Whether the ₹30L roadmap applies to this vertical. */
  hasRoadmap: boolean;
  /** Whether product-level "drift capable" filters apply. */
  hasDriftProducts: boolean;
  /** One line used by the voice-task AI to understand the business. */
  aiContext: string;
};

const POCKET_RC: VerticalLabels = {
  fitName: "Drift",
  fit: { YES_CONFIRMED: "Yes (confirmed)", LIKELY: "Likely", UNKNOWN: "Unknown", NO: "No" },
  fitChipConfirmed: "🏁 Drift",
  fitChipLikely: "Drift?",
  fitConfirmedCard: "Drift confirmed",
  tier: {
    T1_DRIFT_CONFIRMED: "Tier 1 — Drift confirmed",
    T2_STRONG_SIGNAL: "Tier 2 — Strong signal",
    T3_VERIFY_DRIFT: "Tier 3 — Verify drift",
    T4_INDIAMART_GATED: "Tier 4 — IndiaMART gated",
  },
  marketName: "Market level",
  market: {
    BELOW_GREY: "Below grey (retail)",
    GREY: "Grey market",
    ABOVE_GREY: "Above grey (formal)",
  },
  marketShort: { BELOW_GREY: "Retail", GREY: "Grey", ABOVE_GREY: "Above grey" },
  hasRoadmap: true,
  hasDriftProducts: true,
  aiContext: "an RC-car sourcing vertical (drift RC, hobby-grade RC, parts)",
};

const EV_SCOOTERS: VerticalLabels = {
  fitName: "Non-RTO",
  fit: {
    YES_CONFIRMED: "Non-RTO (certificate seen)",
    LIKELY: "Non-RTO (claimed, verify)",
    UNKNOWN: "Unknown",
    NO: "RTO / high-speed",
  },
  fitChipConfirmed: "✓ Non-RTO",
  fitChipLikely: "Non-RTO?",
  fitConfirmedCard: "Non-RTO certified",
  tier: {
    T1_DRIFT_CONFIRMED: "Tier 1 — Deep-verified contact",
    T2_STRONG_SIGNAL: "Tier 2 — Direct number",
    T3_VERIFY_DRIFT: "Tier 3 — Verify contact",
    T4_INDIAMART_GATED: "Tier 4 — IndiaMART gated",
  },
  marketName: "Organisation",
  market: {
    BELOW_GREY: "Retail / dealer",
    GREY: "Unorganized",
    ABOVE_GREY: "Organized",
  },
  marketShort: { BELOW_GREY: "Retail", GREY: "Unorganized", ABOVE_GREY: "Organized" },
  hasRoadmap: false,
  hasDriftProducts: false,
  aiContext:
    "a low-speed non-RTO electric scooter sourcing vertical (≤25 km/h, ≤250 W makers, distributors and traders; dealer margin, MOQ, wattage certificates)",
};

// Battery suppliers for BCH e-cycles (36/48V) and low-speed e-scooters (48/60/72V).
// Tier = how the first phone number was verified; marketLevel = battery chemistry.
const EV_BATTERIES: VerticalLabels = {
  fitName: "EV fit",
  fit: {
    YES_CONFIRMED: "E-cycle / scooter packs listed",
    LIKELY: "EV-capable (ask)",
    UNKNOWN: "Unknown",
    NO: "Not for EV (UPS / solar / captive)",
  },
  fitChipConfirmed: "✓ EV pack",
  fitChipLikely: "EV?",
  fitConfirmedCard: "EV packs listed",
  tier: {
    T1_DRIFT_CONFIRMED: "Tier 1 — Number on website + Google",
    T2_STRONG_SIGNAL: "Tier 2 — Verified number",
    T3_VERIFY_DRIFT: "Tier 3 — Number to verify",
    T4_INDIAMART_GATED: "Tier 4 — No number yet",
  },
  marketName: "Battery type",
  market: {
    BELOW_GREY: "Other / unconfirmed",
    GREY: "Lead-acid (some also lithium)",
    ABOVE_GREY: "Lithium (Li-ion / LFP)",
  },
  marketShort: { BELOW_GREY: "Other", GREY: "Lead-acid", ABOVE_GREY: "Lithium" },
  hasRoadmap: false,
  hasDriftProducts: false,
  aiContext:
    "an EV battery sourcing vertical (lithium Li-ion/LFP pack makers, lead-acid traction makers, cell importers in South India; 36/48V e-cycle and 48/60/72V e-scooter packs; cell grade, AIS-156/BIS certificates, MOQ, warranty)",
};

const LABELS: Record<string, VerticalLabels> = {
  "pocket-rc": POCKET_RC,
  "ev-scooters": EV_SCOOTERS,
  "ev-batteries": EV_BATTERIES,
};

/** Wording for a vertical; unknown verticals get neutral RC-style defaults. */
export function labelsFor(verticalId: string | null | undefined): VerticalLabels {
  return LABELS[verticalId ?? ""] ?? POCKET_RC;
}

/** Client-side: the vertical the user picked (non-httpOnly preference cookie). */
export function currentVerticalIdClient(): string {
  if (typeof document === "undefined") return DEFAULT_VERTICAL_ID;
  const m = document.cookie.match(new RegExp(`(?:^|; )${VERTICAL_COOKIE_NAME}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : DEFAULT_VERTICAL_ID;
}
