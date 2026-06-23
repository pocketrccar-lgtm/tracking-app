// Centralized enum-like constants so the whole app uses the same labels + colors.
// Stored as strings in DB (SQLite-compatible). Use these helpers everywhere.

// Four clean supply-side types. (Importer/Mixed/Retail fold into Trader; OEM/Moulder into Manufacturer.)
export const VENDOR_TYPES = [
  "MANUFACTURER",
  "DISTRIBUTOR",
  "WHOLESALER",
  "TRADER",
] as const;

export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_TIERS = [
  "T1_DRIFT_CONFIRMED",
  "T2_STRONG_SIGNAL",
  "T3_VERIFY_DRIFT",
  "T4_INDIAMART_GATED",
] as const;

export type VendorTier = (typeof VENDOR_TIERS)[number];

// Sourcing funnel: New → Just contacted → Order placed → Active supplier, plus the Wrong-supplier exit.
export const VENDOR_STATUSES = [
  "NEW",
  "CONTACTED",
  "ORDER_PLACED",
  "ACTIVE",
  "WRONG_SUPPLIER",
] as const;

// The forward sourcing funnel (excludes the WRONG_SUPPLIER exit state).
export const VENDOR_STATUS_FUNNEL = [
  "NEW",
  "CONTACTED",
  "ORDER_PLACED",
  "ACTIVE",
] as const;

// Why a vendor was marked a wrong supplier (asked at mark-time).
export const WRONG_REASONS = [
  "RETAILER",
  "DIFFERENT_CATEGORY",
  "INDIAMART_NUMBER",
  "WRONG_CONTACT",
] as const;
export type WrongReason = (typeof WRONG_REASONS)[number];
export const WRONG_REASON_LABELS: Record<WrongReason | "WHOLESALER", string> = {
  RETAILER: "Retailer",
  // Legacy records stored "WHOLESALER" as the reason; keep the label so they render.
  WHOLESALER: "Retailer",
  DIFFERENT_CATEGORY: "Different category",
  INDIAMART_NUMBER: "IndiaMart number",
  WRONG_CONTACT: "Wrong contact details",
};

export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const DRIFT_STATUSES = [
  "YES_CONFIRMED",
  "LIKELY",
  "UNKNOWN",
  "NO",
] as const;

export type DriftStatus = (typeof DRIFT_STATUSES)[number];

export const TASK_TYPES = [
  "CALL",
  "VISIT",
  "WHATSAPP",
  "EMAIL",
  "LINKEDIN_DM",
  "SAMPLE_ORDER",
  "FOLLOW_UP",
  "RESEARCH",
  "OTHER",
  // ─── Business-execution categories (RC launch task system) ───
  "LEGAL",
  "FINANCE",
  "OPS",
  "INVENTORY",
  "MARKETING",
  "CONTENT",
  "PRODUCT",
  "SOURCING",
  "STRATEGY",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
  "CANCELLED",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PO_STATUSES = [
  "SAMPLE",
  "PO_PLACED",
  "IN_TRANSIT",
  "RECEIVED",
  "QA_PASSED",
  "QA_FAILED",
  "REJECTED",
] as const;

export type POStatus = (typeof PO_STATUSES)[number];

export const INTERACTION_OUTCOMES = [
  "NO_ANSWER",
  "CONNECTED",
  "QUOTED",
  "REJECTED",
  "ENGAGED",
  "FOLLOW_UP_SCHEDULED",
] as const;

export type InteractionOutcome = (typeof INTERACTION_OUTCOMES)[number];

// ─── Pretty labels ──────────────────────────────────────────────────────────

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  MANUFACTURER: "Manufacturer",
  DISTRIBUTOR: "Distributor",
  WHOLESALER: "Wholesaler",
  TRADER: "Trader",
};

// ─── Market level — the supply gate ──────────────────────────────────────────
// Only GREY or ABOVE_GREY vendors are real supply tunnels worth ranking.
export const MARKET_LEVELS = ["BELOW_GREY", "GREY", "ABOVE_GREY"] as const;
export type MarketLevel = (typeof MARKET_LEVELS)[number];

export const MARKET_LEVEL_LABELS: Record<MarketLevel, string> = {
  BELOW_GREY: "Below grey (retail)",
  GREY: "Grey market",
  ABOVE_GREY: "Above grey (formal)",
};

export const MARKET_LEVEL_COLORS: Record<MarketLevel, string> = {
  BELOW_GREY: "bg-zinc-200 text-zinc-500",
  GREY: "bg-amber-100 text-amber-800 border-amber-200",
  ABOVE_GREY: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const VENDOR_TIER_LABELS: Record<VendorTier, string> = {
  T1_DRIFT_CONFIRMED: "Tier 1 — Drift confirmed",
  T2_STRONG_SIGNAL: "Tier 2 — Strong signal",
  T3_VERIFY_DRIFT: "Tier 3 — Verify drift",
  T4_INDIAMART_GATED: "Tier 4 — IndiaMART gated",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  NEW: "New",
  CONTACTED: "Just contacted",
  ORDER_PLACED: "Order placed",
  ACTIVE: "Active supplier",
  WRONG_SUPPLIER: "Wrong supplier",
};

export const DRIFT_STATUS_LABELS: Record<DriftStatus, string> = {
  YES_CONFIRMED: "Yes (confirmed)",
  LIKELY: "Likely",
  UNKNOWN: "Unknown",
  NO: "No",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
  CANCELLED: "Cancelled",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  CALL: "Call",
  VISIT: "Visit",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  LINKEDIN_DM: "LinkedIn DM",
  SAMPLE_ORDER: "Sample order",
  FOLLOW_UP: "Follow up",
  RESEARCH: "Research",
  OTHER: "Other",
  // Business-execution categories
  LEGAL: "Legal",
  FINANCE: "Finance",
  OPS: "Ops",
  INVENTORY: "Inventory",
  MARKETING: "Marketing",
  CONTENT: "Content",
  PRODUCT: "Product",
  SOURCING: "Sourcing",
  STRATEGY: "Strategy",
};

// ─── Badge color classes (Tailwind) ─────────────────────────────────────────

export const TIER_COLORS: Record<VendorTier, string> = {
  T1_DRIFT_CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  T2_STRONG_SIGNAL: "bg-red-100 text-red-800 border-red-200",
  T3_VERIFY_DRIFT: "bg-blue-100 text-blue-800 border-blue-200",
  T4_INDIAMART_GATED: "bg-slate-100 text-slate-700 border-slate-200",
};

export const STATUS_COLORS: Record<VendorStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  ORDER_PLACED: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  WRONG_SUPPLIER: "bg-rose-100 text-rose-700 line-through",
};

export const DRIFT_COLORS: Record<DriftStatus, string> = {
  YES_CONFIRMED: "bg-emerald-100 text-emerald-800",
  LIKELY: "bg-red-100 text-red-800",
  UNKNOWN: "bg-slate-100 text-slate-600",
  NO: "bg-zinc-200 text-zinc-500",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  BLOCKED: "bg-red-100 text-red-700",
  CANCELLED: "bg-zinc-200 text-zinc-500",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-red-100 text-red-700",
  URGENT: "bg-red-100 text-red-700",
};

// Default categories seeded in DB
export const DEFAULT_CATEGORIES = [
  { name: "Drift RC", slug: "drift-rc", color: "emerald" },
  { name: "Hobby RC", slug: "hobby-rc", color: "blue" },
  { name: "Parts & Spares", slug: "parts", color: "purple" },
  { name: "OEM / Private Label", slug: "oem", color: "amber" },
  { name: "Plastic Moulders", slug: "moulders", color: "indigo" },
  { name: "Chinese Factories", slug: "china-factories", color: "red" },
  { name: "General Toy", slug: "general-toy", color: "slate" },
];
