"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  TASK_TYPES,
  TASK_STATUSES,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/enums";
import { PHASES } from "@/lib/roadmap";
import { ChevronDown } from "lucide-react";

type Vendor = { id: string; name: string };
type User = { id: string; name: string; role: string };

type Task = {
  id?: string;
  vendorId?: string | null;
  title?: string;
  description?: string | null;
  type?: string;
  priority?: string;
  status?: string;
  assignedToId?: string | null;
  dueDate?: Date | null;
  effortDays?: number | null;
  phase?: string | null;
  notes?: string | null;
};

type Props = {
  task?: Task;
  vendors: Vendor[];
  users: User[];
  defaultVendorId?: string;
  defaultAssigneeId?: string;
  action: (fd: FormData) => void;
  submitLabel: string;
  cancelHref?: string;
  compact?: boolean; // new-task fast path — hide "More details", keep values as hidden fields
};

const selectClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
}

const DUE_CHIPS = [
  { label: "Today", value: plusDays(0) },
  { label: "Tomorrow", value: plusDays(1) },
  { label: "3 days", value: plusDays(3) },
  { label: "Week", value: plusDays(7) },
  { label: "Month", value: plusDays(30) },
  { label: "No date", value: "" },
];

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[46px] rounded-xl px-2 text-sm font-semibold transition-colors active:scale-[0.97] ${
        active ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

export function TaskForm({
  task,
  vendors,
  users,
  defaultVendorId,
  defaultAssigneeId,
  action,
  submitLabel,
  cancelHref,
  compact = false,
}: Props) {
  const [due, setDue] = useState(task?.dueDate ? ymd(new Date(task.dueDate)) : "");
  const [assignee, setAssignee] = useState(
    task?.assignedToId ?? defaultAssigneeId ?? "",
  );
  const [phase, setPhase] = useState(task?.phase ?? "");
  const [showMore, setShowMore] = useState(
    !!(
      task?.vendorId ||
      defaultVendorId ||
      task?.notes ||
      (task?.status && task.status !== "PENDING")
    ),
  );

  const activeChip = DUE_CHIPS.find((c) => c.value === due)?.value ?? null;

  // The three people who own tasks: Syed, Shoaib, Pandey (no CA, no "shared/Both").
  const pick = (re: RegExp) =>
    users.find((u) => u.role !== "advisor" && re.test(u.name) && !/shared/i.test(u.name));
  const assigneeOptions = (
    [
      { u: pick(/syed/i), label: "Syed" },
      { u: pick(/shoaib/i), label: "Shoaib" },
      { u: pick(/pandey/i), label: "Pandey" },
    ] as const
  )
    .filter((x) => x.u)
    .map((x) => ({ id: x.u!.id, label: x.label }));

  return (
    <form action={action} className="space-y-5 pb-40">
      {/* controlled values */}
      <input type="hidden" name="dueDate" value={due} />
      <input type="hidden" name="assignedToId" value={assignee} />
      <input type="hidden" name="phase" value={phase} />

      <div>
        <Label htmlFor="title">What&apos;s the task? *</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={task?.title ?? ""}
          placeholder="e.g. Call DeoDap about no-MOQ drift cars"
          autoFocus
          className="h-12 text-base"
        />
      </div>

      <div>
        <Label>When</Label>
        <div className="flex flex-wrap gap-2">
          {DUE_CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setDue(c.value)}
              className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors active:scale-[0.97] ${
                activeChip === c.value
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Who does it</Label>
        <div className="grid grid-cols-3 gap-2">
          {assigneeOptions.map((o) => (
            <Seg
              key={o.id}
              active={assignee === o.id}
              onClick={() => setAssignee(o.id)}
            >
              {o.label}
            </Seg>
          ))}
        </div>
      </div>

      <div>
        <Label>Stage</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPhase("")}
            className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors active:scale-[0.97] ${
              phase === "" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Auto
          </button>
          {PHASES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPhase(p.key)}
              className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors active:scale-[0.97] ${
                phase === p.key ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {compact ? (
        <>
          {/* fast path: preserve AI-filled / default values without showing the fields */}
          <input type="hidden" name="type" defaultValue={task?.type ?? "SOURCING"} />
          <input type="hidden" name="vendorId" defaultValue={task?.vendorId ?? defaultVendorId ?? ""} />
          <input type="hidden" name="status" defaultValue={task?.status ?? "PENDING"} />
          <input type="hidden" name="effortDays" defaultValue={task?.effortDays ?? 1} />
          <input type="hidden" name="notes" defaultValue={task?.notes ?? task?.description ?? ""} />
        </>
      ) : (
        <>
      {/* More: vendor, status, notes */}
      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600"
      >
        More details
        <ChevronDown
          className={`h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`}
        />
      </button>

      {showMore && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Category</Label>
            <select
              id="type"
              name="type"
              defaultValue={task?.type ?? "SOURCING"}
              className={selectClass}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TASK_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="effortDays">Effort (working days)</Label>
            <Input
              id="effortDays"
              name="effortDays"
              type="number"
              min={1}
              max={30}
              defaultValue={task?.effortDays ?? 1}
              className="h-12"
            />
            <p className="mt-1 text-xs text-slate-400">
              Each day of effort ≈ one day on your ₹30L goal date.
            </p>
          </div>

          <div>
            <Label htmlFor="vendorId">Vendor</Label>
            <select
              id="vendorId"
              name="vendorId"
              defaultValue={task?.vendorId ?? defaultVendorId ?? ""}
              className={selectClass}
            >
              <option value="">— none —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={task?.status ?? "PENDING"}
              className={selectClass}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={task?.notes ?? task?.description ?? ""}
              placeholder="Any extra detail…"
            />
          </div>
        </div>
      )}
        </>
      )}

      {/* Sticky thumb-zone action bar (sits above the bottom nav) */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2 p-3">
          {cancelHref && (
            <Link
              href={cancelHref}
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </Link>
          )}
          <Button type="submit" size="lg" className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
