"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/enums";
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
  notes?: string | null;
};

type Props = {
  task?: Task;
  vendors: Vendor[];
  users: User[];
  defaultVendorId?: string;
  action: (fd: FormData) => void;
  submitLabel: string;
};

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

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
  { label: "No date", value: "" },
  { label: "Today", value: plusDays(0) },
  { label: "Tomorrow", value: plusDays(1) },
  { label: "3 days", value: plusDays(3) },
  { label: "Week", value: plusDays(7) },
  { label: "Month", value: plusDays(30) },
];

export function TaskForm({
  task,
  vendors,
  users,
  defaultVendorId,
  action,
  submitLabel,
}: Props) {
  const initialDue = task?.dueDate ? ymd(new Date(task.dueDate)) : "";
  const [due, setDue] = useState(initialDue);

  const hasDetails = !!(
    task?.id ||
    task?.vendorId ||
    defaultVendorId ||
    task?.type ||
    task?.priority ||
    task?.assignedToId ||
    task?.notes ||
    task?.description
  );
  const [showDetails, setShowDetails] = useState(hasDetails);

  // match a known chip, else "custom" (no chip highlighted)
  const activeChip = DUE_CHIPS.find((c) => c.value === due)?.value ?? null;

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <Label htmlFor="title">What&apos;s the task? *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={task?.title ?? ""}
              placeholder="e.g. Call Ratnaakar about 1:18 drift catalogue"
              autoFocus
            />
          </div>

          <div>
            <Label>Due</Label>
            <input type="hidden" name="dueDate" value={due} />
            <div className="flex flex-wrap gap-2">
              {DUE_CHIPS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setDue(c.value)}
                  className={`rounded-full px-3.5 py-2 min-h-[40px] text-sm font-semibold transition-colors ${
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

          {/* collapsible details */}
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600"
          >
            Details (optional)
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
            />
          </button>

          {showDetails && (
            <div className="space-y-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={task?.type ?? "CALL"}
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
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={task?.priority ?? "MEDIUM"}
                    className={selectClass}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
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
                  <Label htmlFor="assignedToId">Assigned to</Label>
                  <select
                    id="assignedToId"
                    name="assignedToId"
                    defaultValue={task?.assignedToId ?? ""}
                    className={selectClass}
                  >
                    <option value="">Anyone</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={task?.notes ?? task?.description ?? ""}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
