"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

/**
 * Tap-to-edit text field. Shows the value; tapping turns it into a textarea
 * with Save / Cancel. Saves optimistically via the bound server action.
 */
export function InlineEditText({
  initial,
  placeholder,
  save,
  displayClassName,
  emptyLabel,
  singleLine = false,
}: {
  initial: string;
  placeholder: string;
  save: (text: string) => Promise<void>;
  displayClassName?: string;
  emptyLabel?: string;
  singleLine?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [pending, start] = useTransition();

  const commit = () => {
    const next = draft.trim();
    if (next === value.trim()) {
      setEditing(false);
      return;
    }
    setValue(next); // optimistic
    setEditing(false);
    start(async () => {
      try {
        await save(next);
        router.refresh();
      } catch {
        setValue(initial);
        toast.error("Couldn't save");
      }
    });
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (singleLine || e.metaKey)) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          rows={singleLine ? 1 : Math.max(2, draft.split("\n").length + 1)}
          className="w-full resize-none rounded-xl border border-red-400 bg-white p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-200"
          placeholder={placeholder}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={commit}
            disabled={pending}
            className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white active:scale-95"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-600 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="group flex w-full items-start gap-1.5 text-left active:opacity-60"
    >
      {value ? (
        <span className={`min-w-0 flex-1 whitespace-pre-line ${displayClassName ?? ""}`}>
          {value}
        </span>
      ) : (
        <span className={`min-w-0 flex-1 text-slate-400 ${displayClassName ?? ""}`}>
          {emptyLabel ?? placeholder}
        </span>
      )}
      <Pencil className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300 group-active:text-red-500" />
    </button>
  );
}
