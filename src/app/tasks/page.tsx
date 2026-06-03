import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TaskKanban } from "@/components/task-kanban";
import { TaskRow } from "@/components/task-row";
import { Roadmap } from "@/components/roadmap";
import { TASK_TYPE_LABELS, type TaskType } from "@/lib/enums";
import { phaseForTask, PHASE_LABEL } from "@/lib/roadmap";
import { getCachedTaskRows, getCachedUsers } from "@/lib/task-cache";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

type Row = {
  id: string;
  title: string;
  status: string;
  priority: string;
  vendorName: string | null;
  assigneeName: string | null;
  catLabel: string | null;
  dueLabel: string | null;
  overdue: boolean;
  phaseKey: string | null;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    who?: string;
    view?: string;
    phase?: string;
    h?: string;
  }>;
}) {
  const params = await searchParams;
  const view =
    params.view === "list" || params.view === "kanban"
      ? params.view
      : "roadmap";

  // ─── ROADMAP (default) ─────────────────────────────────────────────────────
  if (view === "roadmap") {
    const tasks = await db.task.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 400,
      include: {
        assignedTo: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    });
    return (
      <div>
        <PageHeader title="Roadmap" subtitle="Your climb to ₹30L / month" />
        <div className="px-4 pt-5 pb-32 space-y-4">
          <ViewToggle view={view} />
          <Roadmap tasks={tasks} />
        </div>
        <NewTaskFab />
      </div>
    );
  }

  // ─── LIST / BOARD ──────────────────────────────────────────────────────────
  const who =
    params.who === "mine" || params.who === "shoaib" ? params.who : "both";
  const phaseFilter = params.phase ?? "";
  const horizon = params.h ?? ""; // "" | today | tomorrow | d3 | week | month

  const users = await getCachedUsers();
  const syed =
    users.find((u) => u.email?.toLowerCase().startsWith("syed@")) ??
    users.find((u) => /^syed\b/i.test(u.name));
  const shoaib =
    users.find((u) => u.email?.toLowerCase().startsWith("shoaib@")) ??
    users.find((u) => u.name.trim().toLowerCase() === "shoaib");
  const shared = users.find((u) =>
    u.email?.toLowerCase().startsWith("shared@"),
  );

  // Both = the two partners' combined work (incl. shared), excluding the CA.
  const partnerIds = [syed?.id, shoaib?.id, shared?.id].filter(Boolean) as string[];
  let assignedToIds: string[] | null = null;
  if (who === "mine" && syed) assignedToIds = [syed.id];
  else if (who === "shoaib" && shoaib) assignedToIds = [shoaib.id];
  else if (partnerIds.length) assignedToIds = partnerIds;

  const allWho = await getCachedTaskRows(assignedToIds);

  const todayMs = Date.parse(isoDate(new Date()));

  // horizon = how far ahead to show (cumulative; overdue always included)
  const H_MAX: Record<string, number> = {
    today: 0,
    tomorrow: 1,
    d3: 3,
    week: 7,
    month: 31,
  };
  const hMax = horizon in H_MAX ? H_MAX[horizon] : Infinity;
  const diffOf = (t: { dueMs: number | null }) =>
    t.dueMs !== null ? Math.round((t.dueMs - todayMs) / 86400000) : null;

  const tasks = allWho.filter((t) => {
    if (phaseFilter && phaseForTask(t) !== phaseFilter) return false;
    if (hMax === Infinity) return true; // "All" shows everything
    if (t.status === "COMPLETED") return false; // hide done in a horizon view
    const d = diffOf(t);
    if (d === null) return false; // no-date tasks aren't on a horizon
    return d <= hMax; // includes overdue + within window
  });
  const groups: Record<string, Row[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    later: [],
    nodate: [],
    done: [],
  };

  for (const t of tasks) {
    const base: Row = {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      vendorName: t.vendorName,
      assigneeName: t.assigneeName?.split(" ")[0] ?? null,
      catLabel: TASK_TYPE_LABELS[t.type as TaskType] ?? null,
      dueLabel: null,
      overdue: false,
      phaseKey: phaseForTask(t),
    };
    if (t.status === "COMPLETED") {
      groups.done.push(base);
      continue;
    }
    if (t.dueMs === null) {
      groups.nodate.push(base);
      continue;
    }
    const d = new Date(t.dueMs);
    const diff = Math.round((t.dueMs - todayMs) / 86400000);
    if (diff < 0) groups.overdue.push({ ...base, dueLabel: `${-diff}d overdue`, overdue: true });
    else if (diff === 0) groups.today.push({ ...base, dueLabel: "Today" });
    else if (diff === 1) groups.tomorrow.push({ ...base, dueLabel: "Tomorrow" });
    else if (diff <= 7) groups.week.push({ ...base, dueLabel: format(d, "EEE") });
    else groups.later.push({ ...base, dueLabel: format(d, "d MMM") });
  }

  const SECTIONS: { key: keyof typeof groups; label: string; tone?: string }[] = [
    { key: "overdue", label: "Overdue", tone: "text-red-600" },
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "week", label: "This week" },
    { key: "later", label: "Later" },
    { key: "nodate", label: "No date" },
    { key: "done", label: "Done" },
  ];

  const overdueCount = groups.overdue.length;
  const todayCount = groups.today.length;
  const subtitle =
    overdueCount > 0
      ? `${overdueCount} overdue · ${todayCount} today`
      : todayCount > 0
        ? `${todayCount} due today`
        : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;

  const HORIZONS = [
    { value: "", label: "All" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "d3", label: "3 days" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
  ];
  const phaseName = phaseFilter ? PHASE_LABEL[phaseFilter] ?? phaseFilter : "";

  const hrefFor = (next: { who?: string; phase?: string; h?: string }) => {
    const w = next.who ?? who;
    const ph = next.phase ?? phaseFilter;
    const h = next.h ?? horizon;
    const q = new URLSearchParams();
    q.set("view", view);
    if (w !== "both") q.set("who", w);
    if (ph) q.set("phase", ph);
    if (h) q.set("h", h);
    return `/tasks?${q.toString()}`;
  };

  const seg = (active: boolean) =>
    `flex-1 rounded-lg py-2 min-h-[40px] flex items-center justify-center text-xs font-bold transition-all ${
      active ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
    }`;
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 min-h-[36px] inline-flex items-center text-xs font-semibold whitespace-nowrap ${
      active ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
    }`;

  return (
    <div>
      <PageHeader title="Tasks" subtitle={subtitle} />
      <div className="px-4 pt-5 pb-32 space-y-3">
        <ViewToggle view={view} />

        {/* who: the two partners */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <Link href={hrefFor({ who: "both" })} className={seg(who === "both")}>
            Both
          </Link>
          <Link href={hrefFor({ who: "mine" })} className={seg(who === "mine")}>
            {syed ? syed.name.split(" ")[0] : "Mine"}
          </Link>
          <Link href={hrefFor({ who: "shoaib" })} className={seg(who === "shoaib")}>
            {shoaib ? shoaib.name.split(" ")[0] : "Shoaib"}
          </Link>
        </div>

        {/* time-horizon filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {HORIZONS.map((hz) => (
            <Link key={hz.value} href={hrefFor({ h: hz.value })} className={chip(horizon === hz.value)}>
              {hz.label}
            </Link>
          ))}
        </div>

        {/* phase context (when arrived from the roadmap) */}
        {phaseFilter && (
          <Link
            href={hrefFor({ phase: "" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700"
          >
            Stage: {phaseName} ✕
          </Link>
        )}

        {view === "kanban" ? (
          <TaskKanban
            tasks={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              vendor:
                t.vendorId && t.vendorName
                  ? { id: t.vendorId, name: t.vendorName }
                  : null,
              assignedTo: t.assigneeName ? { name: t.assigneeName } : null,
              dueDate: t.dueMs !== null ? new Date(t.dueMs) : null,
            }))}
          />
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-slate-500">
              No tasks here yet. Tap the red + to add one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5 pt-1">
            {SECTIONS.map(({ key, label, tone }) => {
              const rows = groups[key];
              if (rows.length === 0) return null;
              return (
                <section key={key}>
                  <h2
                    className={`mb-2 flex items-center gap-2 px-1 text-xs font-extrabold uppercase tracking-wider ${tone ?? "text-slate-400"}`}
                  >
                    {label}
                    <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-500">
                      {rows.length}
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {rows.map((r) => (
                      <TaskRow key={r.id} {...r} showPhase />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <NewTaskFab />
    </div>
  );
}

function ViewToggle({ view }: { view: string }) {
  const seg = (active: boolean) =>
    `flex-1 rounded-lg py-2 min-h-[40px] flex items-center justify-center text-xs font-bold transition-all ${
      active ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
    }`;
  return (
    <div className="flex rounded-xl bg-slate-100 p-1">
      <Link href="/tasks" className={seg(view === "roadmap")}>
        Roadmap
      </Link>
      <Link href="/tasks?view=list" className={seg(view === "list")}>
        List
      </Link>
      <Link href="/tasks?view=kanban" className={seg(view === "kanban")}>
        Board
      </Link>
    </div>
  );
}

function NewTaskFab() {
  return (
    <Link
      href="/tasks/new"
      aria-label="New task"
      className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg active:scale-95 transition-transform"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
