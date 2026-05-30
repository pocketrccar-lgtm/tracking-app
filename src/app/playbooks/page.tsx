import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PlaybookEditor } from "@/components/playbook-editor";
import { createPlaybook } from "@/actions/playbooks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

export default async function PlaybooksPage() {
  const [playbooks, categories] = await Promise.all([
    db.playbook.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { category: true },
    }),
    db.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Research playbooks"
        subtitle="The funnels we use to find vendors — edit freely"
      />
      <div className="px-4 pt-5 pb-28 space-y-4">
        <Link
          href="/more"
          className="inline-flex items-center gap-1 text-sm text-slate-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to More
        </Link>

        {playbooks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No playbooks yet — add your first funnel below.
          </p>
        ) : (
          <div className="space-y-2">
            {playbooks.map((p) => (
              <PlaybookEditor key={p.id} playbook={p} />
            ))}
          </div>
        )}

        <details className="rounded-2xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">
            + Add a playbook
          </summary>
          <form action={createPlaybook} className="mt-3 space-y-3">
            <Input name="title" placeholder="Title (e.g. LinkedIn founder scan)" required />
            <select name="kind" defaultValue="OTHER" className={selectClass}>
              {["APIFY", "YOUTUBE", "GEMINI", "MAPS", "ZAUBA", "OTHER"].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select name="categoryId" defaultValue="" className={selectClass}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Textarea name="content" rows={6} placeholder="Steps, scripts, queries, tips…" />
            <Button type="submit" className="w-full">
              Add playbook
            </Button>
          </form>
        </details>
      </div>
    </div>
  );
}
