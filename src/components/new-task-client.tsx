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
}: {
  vendors: Vendor[];
  users: User[];
  defaultVendorId?: string;
}) {
  const [prefill, setPrefill] = useState<{
    vendorId?: string;
    title?: string;
    type?: string;
    priority?: string;
    dueDate?: Date | null;
    notes?: string | null;
  }>({});
  const [version, setVersion] = useState(0);

  const onExtract = (t: ExtractedTask) => {
    setPrefill({
      vendorId: t.vendorId ?? defaultVendorId,
      title: t.title,
      type: t.type,
      priority: t.priority,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
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
        action={createTask}
        submitLabel="Create task"
      />
    </div>
  );
}
