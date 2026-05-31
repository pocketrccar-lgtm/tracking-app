"use client";

import { useState } from "react";
import { TaskForm } from "@/components/task-form";
import { VoiceTaskInput, type ExtractedTask } from "@/components/voice-task-input";
import { createTask } from "@/actions/tasks";

type Vendor = { id: string; name: string };
type User = { id: string; name: string; role: string };

export function NewTaskClient({
  vendors,
  users,
  defaultVendorId,
  defaultAssigneeId,
}: {
  vendors: Vendor[];
  users: User[];
  defaultVendorId?: string;
  defaultAssigneeId?: string;
}) {
  // New tasks default to: due today + assigned to the default partner.
  const [prefill, setPrefill] = useState<{
    vendorId?: string;
    title?: string;
    priority?: string;
    assignedToId?: string | null;
    dueDate?: Date | null;
    notes?: string | null;
  }>({ dueDate: new Date(), assignedToId: defaultAssigneeId ?? null });
  const [version, setVersion] = useState(0);

  const onExtract = (t: ExtractedTask) => {
    setPrefill({
      vendorId: t.vendorId ?? defaultVendorId,
      title: t.title,
      priority: t.priority,
      assignedToId: t.assignedToId ?? defaultAssigneeId ?? null,
      dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
      notes: t.notes ?? null,
    });
    setVersion((v) => v + 1); // remount TaskForm with new defaults
  };

  return (
    <div className="space-y-4">
      <VoiceTaskInput onExtract={onExtract} />
      <TaskForm
        key={version}
        task={prefill}
        vendors={vendors}
        users={users}
        defaultVendorId={defaultVendorId}
        defaultAssigneeId={defaultAssigneeId}
        action={createTask}
        submitLabel="Create task"
      />
    </div>
  );
}
