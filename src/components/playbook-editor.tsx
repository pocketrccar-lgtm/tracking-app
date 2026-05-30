"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updatePlaybook, deletePlaybook } from "@/actions/playbooks";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronDown, Trash2 } from "lucide-react";

const KINDS = ["APIFY", "YOUTUBE", "GEMINI", "MAPS", "ZAUBA", "OTHER"];

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

const KIND_COLORS: Record<string, string> = {
  APIFY: "bg-orange-100 text-orange-700",
  YOUTUBE: "bg-red-100 text-red-700",
  GEMINI: "bg-blue-100 text-blue-700",
  MAPS: "bg-emerald-100 text-emerald-700",
  ZAUBA: "bg-purple-100 text-purple-700",
  OTHER: "bg-slate-100 text-slate-600",
};

export function PlaybookEditor({
  playbook,
}: {
  playbook: { id: string; title: string; kind: string; content: string };
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const save = updatePlaybook.bind(null, playbook.id);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3.5 text-left"
      >
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${KIND_COLORS[playbook.kind] ?? KIND_COLORS.OTHER}`}
        >
          {playbook.kind}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          {playbook.title}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          {!editing ? (
            <>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {playbook.content}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(true)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </>
          ) : (
            <form
              action={async (fd) => {
                await save(fd);
                setEditing(false);
                toast.success("Playbook saved");
              }}
              className="space-y-3"
            >
              <Input name="title" defaultValue={playbook.title} />
              <select name="kind" defaultValue={playbook.kind} className={selectClass}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <Textarea name="content" rows={10} defaultValue={playbook.content} />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete "${playbook.title}"?`}
        description="This removes the playbook permanently."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          await deletePlaybook(playbook.id);
          toast.success("Deleted");
          setConfirm(false);
        }}
      />
    </div>
  );
}
