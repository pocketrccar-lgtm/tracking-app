import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText } from "lucide-react";

export default function ReportsLanding() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">
          Auto-generated summaries for daily WhatsApp + weekly review.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/reports/daily" className="block">
          <Card className="hover:border-emerald-400 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base">Daily report</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              For Shoaib&apos;s 7 PM WhatsApp to Syed. Today&apos;s calls, visits,
              new vendors, pending tasks. One-click copy.
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/weekly" className="block">
          <Card className="hover:border-emerald-400 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base">Weekly summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Friday review: tasks shipped, pipeline movement, top vendors,
              pending decisions. One-click copy.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
