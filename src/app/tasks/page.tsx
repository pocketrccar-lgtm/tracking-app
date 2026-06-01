import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TaskKanban } from "@/components/task-kanban";
import { TaskRow } from "@/components/task-row";
import { TASK_TYPE_LABELS, type TaskType } from "@/lib/enums";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

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
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; view?: string; cat?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "kanban" ? "kanban" : "list";
  const who =
    params.who === "mine" || params.who === "theirs" ? params.who : "all";
  const cat = params.cat ?? "";

  const users = await db.user.findMany({ orderBy: { name: "asc" } });
  const me = users.find((u) => /syed/i.test(u.name)) ?? users[0];
  const other = users.find((u) => u.id !== me?.id);

  const where: Record<string, unknown> = {};
  if (who === "mine" && me) where.assignedToId = me.id;
  if (who === "theirs" && other) where.assignedToId = other.id;
  if (cat) where.type = cat;

  const [tasks, byCat] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 300,
      include: {
        vendor: { select: { id: true, name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    db.task.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);

  const todayMs = Date.parse(isoDate(new Date()));
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
      vendorName: t.vendor?.name ?? null,
      assigneeName: t.assignedTo?.name?.split(" ")[0] ?? null,
      catLabel: TASK_TYPE_LABELS[t.type as TaskType] ?? null,
      dueLabel: null,
      overdue: false,
    };
    if (t.status === "COMPLETED") {
      groups.done.push(base);
      continue;
    }
    if (!t.dueDate) {
      groups.nodate.push(base);
      continue;
    }
    const d = new Date(t.dueDate);
    const diff = Math.round((Date.parse(isoDate(d)) - todayMs) / 86400000);
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

  // categories that actually have tasks, for the filter row
  const catChips = byCat
    .filter((c) => c._count._all > 0)
    .map((c) => ({ value: c.type, label: TASK_TYPE_LABELS[c.type as TaskType] ?? c.type, count: c._count._all }))
    .sort((a, b) => b.count - a.count);

  const hrefFor = (next: { who?: string; view?: string; cat?: string }) => {
    const w = next.who ?? who;
    const v = next.view ?? view;
    const c = next.cat ?? cat;
    const q = new URLSearchParams();
    if (w !== "all") q.set("who", w);
    if (v === "kanban") q.set("view", v);
    if (c) q.set("cat", c);
    const s = q.toString();
    return s ? `/tasks?${s}` : "/tasks";
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
        {/* who segment + view toggle in one row */}
        <div className="flex gap-2">
          <div className="flex flex-1 rounded-xl bg-slate-100 p-1">
            <Link href={hrefFor({ who: "all" })} className={seg(who === "all")}>
              All
            </Link>
            <Link href={hrefFor({ who: "mine" })} className={seg(who === "mine")}>
              Mine
            </Link>
            <Link href={hrefFor({ who: "theirs" })} className={seg(who === "theirs")}>
              {other ? other.name.split(" ")[0] : "Theirs"}
            </Link>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <Link href={hrefFor({ view: "list" })} className={`${seg(view === "list")} px-3`}>
              List
            </Link>
            <Link href={hrefFor({ view: "kanban" })} className={`${seg(view === "kanban")} px-3`}>
              Board
            </Link>
          </div>
        </div>

        {/* category filter (only categories that have tasks) */}
        {catChips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <Link href={hrefFor({ cat: "" })} className={chip(!cat)}>
              All
            </Link>
            {catChips.map((c) => (
              <Link key={c.value} href={hrefFor({ cat: c.value })} className={chip(cat === c.value)}>
                {c.label}
              </Link>
            ))}
          </div>
        )}

        {view === "kanban" ? (
          <TaskKanban
            tasks={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              vendor: t.vendor,
              assignedTo: t.assignedTo,
              dueDate: t.dueDate,
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
                      <TaskRow key={r.id} {...r} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* thumb-zone FAB */}
      <Link
        href="/tasks/new"
        aria-label="New task"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
