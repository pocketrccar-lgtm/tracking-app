import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDailyReport, formatDailyReportText } from "@/lib/report-builders";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; userId?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date ? new Date(sp.date) : new Date();
  const dateStr = date.toISOString().slice(0, 10);

  const users = await db.user.findMany({ orderBy: { name: "asc" } });
  const userId = sp.userId ?? users[0]?.id ?? null;
  const user = users.find((u) => u.id === userId);

  const data = await buildDailyReport(db, { userId, date });
  const text = formatDailyReportText(data, user?.name);

  return (
    <div className="px-4 pt-5 pb-28 space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Daily report</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            {dateStr}
            {user ? ` · ${user.name}` : ""}
          </p>
        </div>
        <form className="flex gap-2" method="get">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            className="h-11 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
          <select
            name="userId"
            defaultValue={userId ?? ""}
            className="h-11 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-md bg-slate-900 px-3 text-sm text-white"
          >
            Refresh
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-slate-500 dark:text-neutral-400">Interactions</div>
            <div className="mt-1 text-3xl font-bold">{data.interactionsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-slate-500 dark:text-neutral-400">Tasks completed</div>
            <div className="mt-1 text-3xl font-bold">{data.tasksCompletedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-slate-500 dark:text-neutral-400">New vendors</div>
            <div className="mt-1 text-3xl font-bold">{data.newVendorsToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase text-slate-500 dark:text-neutral-400">Pending tasks</div>
            <div className="mt-1 text-3xl font-bold">{data.pendingTasks}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">WhatsApp-ready text</CardTitle>
          <CopyToClipboard text={text} label="Copy report" />
        </CardHeader>
        <CardContent>
          <textarea
            readOnly
            value={text}
            className="w-full min-h-[400px] rounded-md border border-slate-200 bg-slate-50 p-3 text-xs font-mono"
          />
        </CardContent>
      </Card>
    </div>
  );
}
