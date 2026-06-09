// Goal-roadmap model + math. North-star: ₹30 lakh / month revenue.
// Locked decisions: ETA auto-projected (overdue work slips it), progress = % tasks
// done, sequential milestone PHASES, effort = 1 working-day/task (Task.effortDays).
//
// The seed encodes real structure inside each task:
//   notes:       "[RC-SEED] Phase: Sprint 0 - Foundation | ... | Depends: <full blocker title>"
//   description: "[CATEGORY] ... DEPENDS-ON: <...>. DONE-WHEN: <criteria>. See NN."
// We parse those to drive phases, the dependency graph ("unlocks N"), and done-when.

export const GOAL_LABEL = "₹30L / month";
export const GOAL_SUBLABEL = "₹30 lakh monthly revenue";

// Fixed sprint length: ₹30L target is 90 days from the day we started.
export const TARGET_DAYS = 90;

const DAY = 86_400_000;
const isoMs = (d: Date) => Date.parse(d.toISOString().slice(0, 10));

export type Phase = {
  key: string;
  label: string;
  tagline: string;
  color: string; // tailwind hue base
};

// The journey to ₹30L, in funnel order. Each stage makes the next possible:
// set up → go live organic → win prepaid trust → scale with paid → scale channels.
export const PHASES: Phase[] = [
  { key: "foundation", label: "Foundation", tagline: "Legal + money rails", color: "blue" },
  { key: "launch", label: "Launch", tagline: "Live & first organic sales", color: "amber" },
  { key: "prepaid", label: "Prepaid", tagline: "Prepaid orders, build trust", color: "purple" },
  { key: "paid", label: "Paid", tagline: "Paid acquisition on", color: "pink" },
  { key: "scale", label: "Scale to ₹30L", tagline: "Marketplaces + grow", color: "emerald" },
];

const SPRINT_TO_PHASE: Record<string, string> = {
  "0": "foundation",
  "1": "launch",
  "2": "prepaid",
  "3": "scale",
};

export const PHASE_KEYS = PHASES.map((p) => p.key);
export const PHASE_LABEL: Record<string, string> = Object.fromEntries(
  PHASES.map((p) => [p.key, p.label]),
);
const isPhaseKey = (k: string | null | undefined): k is string =>
  !!k && PHASE_KEYS.includes(k);

export type RoadmapTask = {
  id: string;
  title: string;
  createdAt?: Date | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
  effortDays: number | null;
  type: string;
  phase: string | null;
  notes: string | null;
  description: string | null;
  assignedTo?: { name: string } | null;
  vendor?: { name: string } | null;
};

const isDone = (t: { status: string }) => t.status === "COMPLETED";
const eff = (t: { effortDays: number | null }) => Math.max(1, t.effortDays ?? 1);

// ─── parsing helpers ─────────────────────────────────────────────────────────

export function phaseForTask(t: {
  phase?: string | null;
  notes: string | null;
  type: string;
}): string {
  // Manual assignment always wins over the seed's auto-guess.
  if (isPhaseKey(t.phase)) return t.phase;
  const m = (t.notes ?? "").match(/Sprint\s*([0-3])/i);
  if (m && SPRINT_TO_PHASE[m[1]]) return SPRINT_TO_PHASE[m[1]];
  return "launch"; // lone/un-tagged tasks sit in the launch sprint
}

export function doneWhen(t: { description: string | null }): string | null {
  const m = (t.description ?? "").match(/DONE-WHEN:\s*([^]*?)(?:\s*See\s+\d+\.?\s*)?$/i);
  return m ? m[1].trim().replace(/\s+/g, " ") : null;
}

function dependsText(t: { notes: string | null }): string {
  const m = (t.notes ?? "").match(/Depends:\s*([^|]+)/i);
  return m ? m[1].trim() : "";
}

// distinctive normalized key from a title, for graph matching
function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop parentheticals
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 5)
    .join(" ");
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// ─── dependency graph ────────────────────────────────────────────────────────

export type Graph = {
  unlocks: Map<string, number>; // task id -> how many tasks it directly unblocks
  blockers: Map<string, RoadmapTask[]>; // task id -> incomplete tasks blocking it
  ready: Set<string>; // incomplete task ids whose blockers are all done
};

export function buildGraph(tasks: RoadmapTask[]): Graph {
  const unlocks = new Map<string, number>();
  const blockers = new Map<string, RoadmapTask[]>();
  const ready = new Set<string>();

  const keyed = tasks.map((t) => ({ t, key: titleKey(t.title) }));

  for (const t of tasks) {
    const dep = norm(dependsText(t));
    if (!dep || /\bnone\b/.test(dep)) {
      blockers.set(t.id, []);
      continue;
    }
    const myBlockers = keyed
      .filter(
        (k) => k.t.id !== t.id && k.key.length >= 6 && dep.includes(k.key),
      )
      .map((k) => k.t);
    blockers.set(t.id, myBlockers);
    for (const b of myBlockers) {
      unlocks.set(b.id, (unlocks.get(b.id) ?? 0) + 1);
    }
  }

  for (const t of tasks) {
    if (isDone(t)) continue;
    const open = (blockers.get(t.id) ?? []).filter((b) => !isDone(b));
    if (open.length === 0) ready.add(t.id);
  }

  return { unlocks, blockers, ready };
}

// ─── overall summary (slip-based ETA) ────────────────────────────────────────

export type RoadmapSummary = {
  total: number;
  done: number;
  progressPct: number;
  remainingEffort: number;
  startDate: Date;
  targetDays: number;
  dayNumber: number; // which day of the 90 we're on
  daysLeftPlanned: number; // days left to the fixed 90-day target
  behindDays: number; // how many days overdue work has pushed the goal out
  plannedGoalDate: Date; // the fixed 90-day deadline
  projectedGoalDate: Date; // deadline + slip from overdue work
  daysToGoal: number;
  slipDays: number;
  overdueCount: number;
  dueTodayCount: number;
  doneThisWeek: number;
  onTrack: boolean;
};

export function computeRoadmap(tasks: RoadmapTask[], now = new Date()): RoadmapSummary {
  const todayMs = isoMs(now);
  const total = tasks.length;
  const done = tasks.filter(isDone).length;
  const progressPct = total ? Math.round((done / total) * 100) : 0;

  const incomplete = tasks.filter((t) => !isDone(t));
  const remainingEffort = incomplete.reduce((s, t) => s + eff(t), 0);

  // Fixed 90-day window from the day we started (earliest task created).
  const createdMs = tasks
    .map((t) => (t.createdAt ? isoMs(t.createdAt) : null))
    .filter((x): x is number => x !== null);
  const startMs = createdMs.length ? Math.min(...createdMs) : todayMs;
  const plannedGoalMs = startMs + TARGET_DAYS * DAY;
  const dayNumber = Math.max(1, Math.round((todayMs - startMs) / DAY) + 1);
  const daysLeftPlanned = Math.round((plannedGoalMs - todayMs) / DAY);

  // Overdue backlog = incomplete work already past due. It must be cleared,
  // pushing the whole tail out by its effort → "each delay adds X days".
  const overdue = incomplete.filter((t) => t.dueDate && isoMs(t.dueDate as Date) < todayMs);
  const slipDays = overdue.reduce((s, t) => s + eff(t), 0);
  const dueTodayCount = incomplete.filter(
    (t) => t.dueDate && isoMs(t.dueDate as Date) === todayMs,
  ).length;

  const projectedGoalMs = Math.max(plannedGoalMs, todayMs) + slipDays * DAY;

  const weekAgo = todayMs - 7 * DAY;
  const doneThisWeek = tasks.filter(
    (t) => t.completedAt && isoMs(t.completedAt as Date) >= weekAgo,
  ).length;

  return {
    total,
    done,
    progressPct,
    remainingEffort,
    startDate: new Date(startMs),
    targetDays: TARGET_DAYS,
    dayNumber,
    daysLeftPlanned,
    behindDays: slipDays,
    plannedGoalDate: new Date(plannedGoalMs),
    projectedGoalDate: new Date(projectedGoalMs),
    daysToGoal: Math.max(0, Math.round((projectedGoalMs - todayMs) / DAY)),
    slipDays,
    overdueCount: overdue.length,
    dueTodayCount,
    doneThisWeek,
    onTrack: slipDays === 0,
  };
}

// ─── phase rollups ───────────────────────────────────────────────────────────

export type PhaseRollup = Phase & {
  total: number;
  done: number;
  pct: number;
  overdue: number;
  state: "done" | "current" | "upcoming";
};

export function buildPhases(tasks: RoadmapTask[], now = new Date()): PhaseRollup[] {
  const todayMs = isoMs(now);
  const rollups = PHASES.map((p) => {
    const items = tasks.filter((t) => phaseForTask(t) === p.key);
    const total = items.length;
    const done = items.filter(isDone).length;
    const overdue = items.filter(
      (t) => !isDone(t) && t.dueDate && isoMs(t.dueDate as Date) < todayMs,
    ).length;
    return {
      ...p,
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
      overdue,
      state: "upcoming" as PhaseRollup["state"],
    };
  });

  const currentIdx = rollups.findIndex((r) => r.total > 0 && r.done < r.total);
  rollups.forEach((r, i) => {
    if (r.total > 0 && r.done === r.total) r.state = "done";
    else if (i === currentIdx) r.state = "current";
    else r.state = "upcoming";
  });
  return rollups;
}

// ─── "your next move" — highest-leverage ready tasks ─────────────────────────

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function nextMoves(
  tasks: RoadmapTask[],
  graph: Graph,
  opts: { assigneeName?: string; limit?: number } = {},
): RoadmapTask[] {
  const pool = tasks.filter(
    (t) =>
      !isDone(t) &&
      graph.ready.has(t.id) &&
      (!opts.assigneeName || t.assignedTo?.name === opts.assigneeName),
  );
  pool.sort((a, b) => {
    const ua = graph.unlocks.get(a.id) ?? 0;
    const ub = graph.unlocks.get(b.id) ?? 0;
    if (ub !== ua) return ub - ua; // most unlocks first (keystones)
    const da = a.dueDate ? isoMs(a.dueDate) : Infinity;
    const db2 = b.dueDate ? isoMs(b.dueDate) : Infinity;
    if (da !== db2) return da - db2; // soonest due
    return (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2);
  });
  return pool.slice(0, opts.limit ?? 1);
}
