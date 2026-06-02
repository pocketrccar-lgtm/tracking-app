import Link from "next/link";
import { format } from "date-fns";
import { Flag, Lock, Check, AlertTriangle, ChevronRight } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { TaskRow } from "@/components/task-row";
import {
  computeRoadmap,
  buildPhases,
  buildGraph,
  nextMoves,
  GOAL_LABEL,
  type RoadmapTask,
  type PhaseRollup,
} from "@/lib/roadmap";
import { TASK_TYPE_LABELS, type TaskType } from "@/lib/enums";

const isoMs = (d: Date) => Date.parse(d.toISOString().slice(0, 10));

function dueLabelFor(d: Date | null, nowMs: number) {
  if (!d) return { label: null as string | null, overdue: false };
  const diff = Math.round((isoMs(d) - nowMs) / 86400000);
  if (diff < 0) return { label: `${-diff}d overdue`, overdue: true };
  if (diff === 0) return { label: "Today", overdue: false };
  if (diff === 1) return { label: "Tomorrow", overdue: false };
  if (diff <= 7) return { label: format(d, "EEE"), overdue: false };
  return { label: format(d, "d MMM"), overdue: false };
}

const BAR: Record<string, string> = {
  blue: "text-blue-500",
  amber: "text-amber-500",
  purple: "text-purple-500",
  pink: "text-pink-500",
  red: "text-red-500",
  emerald: "text-emerald-500",
  teal: "text-teal-500",
};
const DOT: Record<string, string> = {
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
};

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="px-1">
      <div className="text-lg font-bold tabular-nums text-slate-900">{big}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {small}
      </div>
    </div>
  );
}

export function Roadmap({ tasks }: { tasks: RoadmapTask[] }) {
  const now = new Date();
  const nowMs = isoMs(now);
  const s = computeRoadmap(tasks, now);
  const phases = buildPhases(tasks, now);
  const graph = buildGraph(tasks);
  const moves = nextMoves(tasks, graph, { limit: 3 });
  const current =
    phases.find((p) => p.state === "current") ??
    phases.find((p) => p.total > 0) ??
    phases[0];

  const eta = format(s.projectedGoalDate, "d MMM yyyy");
  const ringColor = BAR[current?.color ?? "teal"] ?? "text-teal-500";
  const ringPct = current?.total
    ? Math.round((current.done / current.total) * 100)
    : s.progressPct;

  return (
    <div className="space-y-5">
      {/* SUMMIT HERO */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-amber-50/70 to-white p-5">
        <div className="flex items-center justify-center gap-1.5 text-sm font-extrabold tracking-wide text-slate-900">
          <Flag className="h-4 w-4 text-amber-500" /> {GOAL_LABEL.toUpperCase()}
        </div>
        <p
          className={`mt-0.5 text-center text-xs font-semibold ${
            s.onTrack ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {s.onTrack
            ? `On track for ~${eta}`
            : `~${eta} · ${s.slipDays} day${s.slipDays === 1 ? "" : "s"} behind`}
        </p>

        <div className="my-3 flex justify-center">
          <ProgressRing value={ringPct} size={150} stroke={13} barClass={ringColor}>
            <div className="text-3xl font-extrabold tabular-nums text-slate-900">
              {s.done}
              <span className="text-lg text-slate-400">/{s.total}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              tasks done · {s.progressPct}%
            </div>
          </ProgressRing>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-white/70 py-2 text-center">
          <Stat big={`${s.daysToGoal}`} small="days to goal" />
          <Stat big={`${s.doneThisWeek}`} small="done / week" />
          <Stat
            big={current ? `${current.done}/${current.total}` : "—"}
            small={current?.label ?? "phase"}
          />
        </div>
      </div>

      {/* SLIP / ON-TRACK */}
      {s.slipDays > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <span className="font-bold">
                ₹30L slipped +{s.slipDays} day{s.slipDays === 1 ? "" : "s"}
              </span>{" "}
              → now ~{eta}. {s.overdueCount} overdue task
              {s.overdueCount === 1 ? "" : "s"} pushed it out — clear them to win
              the days back.
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          🎯 On pace — every task you close keeps ₹30L on {eta}.
        </div>
      )}

      {/* YOUR NEXT MOVE */}
      {moves.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Do this next
          </h2>
          <div className="space-y-2">
            {moves.map((m) => {
              const dl = dueLabelFor(m.dueDate, nowMs);
              const u = graph.unlocks.get(m.id) ?? 0;
              return (
                <TaskRow
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  status={m.status}
                  priority={m.priority}
                  vendorName={m.vendor?.name ?? null}
                  assigneeName={m.assignedTo?.name?.split(" ")[0] ?? null}
                  catLabel={TASK_TYPE_LABELS[m.type as TaskType] ?? null}
                  dueLabel={dl.label}
                  overdue={dl.overdue}
                  note={u > 0 ? `🔑 unlocks ${u}` : null}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* CLIMB PATH */}
      <section>
        <h2 className="mb-3 px-1 text-xs font-extrabold uppercase tracking-wider text-slate-400">
          The climb to ₹30L
        </h2>
        <div>
          {phases.map((p, i) => (
            <PhaseNode key={p.key} p={p} isLast={i === phases.length - 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PhaseNode({ p, isLast }: { p: PhaseRollup; isLast: boolean }) {
  const done = p.state === "done";
  const current = p.state === "current";
  return (
    <div className="flex gap-3">
      {/* left rail: ring + connector */}
      <div className="flex flex-col items-center">
        <ProgressRing value={p.pct} size={48} stroke={6} barClass={BAR[p.color] ?? "text-teal-500"}>
          {done ? (
            <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
          ) : (
            <span className="text-[10px] font-bold text-slate-700">{p.pct}%</span>
          )}
        </ProgressRing>
        {!isLast && <div className="my-1 w-0.5 flex-1 rounded-full bg-slate-200" />}
      </div>

      {/* card → tap to curate this phase's tasks */}
      <Link
        href={`/tasks?view=list&phase=${p.key}`}
        className={`mb-3 flex-1 rounded-2xl border p-3.5 transition-transform active:scale-[0.99] ${
          current
            ? "border-slate-300 bg-white shadow-sm"
            : done
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-slate-200 bg-white/60"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${DOT[p.color] ?? "bg-slate-400"}`} />
          <span
            className={`text-sm font-bold ${done ? "text-emerald-800" : "text-slate-900"}`}
          >
            {p.label}
          </span>
          {current && (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
              YOU ARE HERE
            </span>
          )}
          {!current && !done && p.total > 0 && (
            <Lock className="h-3 w-3 text-slate-300" />
          )}
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold tabular-nums text-slate-500">
            {p.done}/{p.total}
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span>{p.tagline}</span>
          {p.overdue > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 font-bold text-amber-700">
              {p.overdue} overdue
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
