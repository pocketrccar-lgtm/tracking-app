"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_WA_TEMPLATE,
  getTemplate,
  setTemplate,
} from "@/lib/whatsapp";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [value, setValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setValue(getTemplate());
    setMounted(true);
  }, []);

  const save = () => {
    setTemplate(value);
    toast.success("Template saved");
  };

  const reset = () => {
    setValue(DEFAULT_WA_TEMPLATE);
    setTemplate(DEFAULT_WA_TEMPLATE);
    toast.success("Reset to default");
  };

  return (
    <div>
      <PageHeader
        title="WhatsApp template"
        subtitle="Sent when you tap the WhatsApp button on a vendor"
      />
      <div className="px-4 pt-5 pb-28 space-y-4">
        <Link
          href="/more"
          className="inline-flex items-center gap-1 text-sm text-slate-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to More
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-500">
            Use <code className="rounded bg-slate-100 px-1">{"{vendor}"}</code> to
            insert the vendor&apos;s name.
          </div>
          <Textarea
            rows={8}
            value={mounted ? value : ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your catalogue-request message…"
          />
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1">
              Save template
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preview
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {(mounted ? value : DEFAULT_WA_TEMPLATE).replaceAll(
              "{vendor}",
              "Ratnaakar Impex",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
