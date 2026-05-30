"use client";

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

type Vendor = { id: string; name: string };
type User = { id: string; name: string; role: string };

type Task = {
  id?: string;
  vendorId?: string;
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

export function TaskForm({
  task,
  vendors,
  users,
  defaultVendorId,
  action,
  submitLabel,
}: Props) {
  const dueDateStr = task?.dueDate
    ? new Date(task.dueDate).toISOString().slice(0, 10)
    : "";

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={task?.title ?? ""}
              placeholder="e.g. Call about drift RC catalog"
            />
          </div>

          <div>
            <Label htmlFor="vendorId">Vendor *</Label>
            <select
              id="vendorId"
              name="vendorId"
              defaultValue={task?.vendorId ?? defaultVendorId ?? ""}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                defaultValue={task?.type ?? "CALL"}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
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
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
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
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="assignedToId">Assigned to</Label>
              <select
                id="assignedToId"
                name="assignedToId"
                defaultValue={task?.assignedToId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={dueDateStr}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={task?.notes ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
