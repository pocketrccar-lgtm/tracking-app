import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const TASKS_TAG = "tasks";
export const USERS_TAG = "users";

// Date-only (midnight UTC) ms — matches the isoDate() grouping the list uses.
const dayMs = (d: Date) => Date.parse(d.toISOString().slice(0, 10));

export type CachedTaskRow = {
  id: string;
  seq: number;
  title: string;
  status: string;
  priority: string;
  type: string;
  phase: string | null;
  notes: string | null;
  dueMs: number | null;
  vendorId: string | null;
  vendorName: string | null;
  assigneeName: string | null;
};

/**
 * Cached task list for the partner set. Returns plain serializable rows
 * (dates as numbers) so the Data Cache can't mangle Date objects.
 * Tagged "tasks" — every task mutation calls revalidateTag("tasks").
 */
export const getCachedTaskRows = unstable_cache(
  async (assignedToIds: string[] | null): Promise<CachedTaskRow[]> => {
    const tasks = await db.task.findMany({
      where: assignedToIds ? { assignedToId: { in: assignedToIds } } : {},
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 400,
      include: {
        vendor: { select: { id: true, name: true } },
        assignedTo: { select: { name: true } },
      },
    });
    return tasks.map((t) => ({
      id: t.id,
      seq: t.seq,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
      phase: t.phase,
      notes: t.notes,
      dueMs: t.dueDate ? dayMs(t.dueDate) : null,
      vendorId: t.vendor?.id ?? null,
      vendorName: t.vendor?.name ?? null,
      assigneeName: t.assignedTo?.name ?? null,
    }));
  },
  ["task-rows"],
  { tags: [TASKS_TAG], revalidate: 30 },
);

export type CachedUser = { id: string; name: string; email: string | null };

export const getCachedUsers = unstable_cache(
  async (): Promise<CachedUser[]> => {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return users;
  },
  ["all-users"],
  { tags: [USERS_TAG], revalidate: 120 },
);
