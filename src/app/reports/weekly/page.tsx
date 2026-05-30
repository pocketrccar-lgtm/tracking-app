import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWeeklyReport, formatWeeklyReportText } from "@/lib/report-builders";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WeeklyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekOf?: string }>;
}) {
  const sp = await searchParams;
  const weekOf = sp.weekOf ? new Date(sp.weekOf) : new Date();
  const data = await buildWeeklyReport(db, { weekOf });
  const text = formatWeeklyReportText(data);

  return (
    <div className="px-4 pt-5 pb-28 space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Weekly summary</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          {data.weekStart.toLocaleDateString()} – {data.weekEnd.toLocaleDateString()}
        </p>
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
