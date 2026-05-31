import { PrismaClient } from "@/generated/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns";

export async function buildDailyReport(
  db: PrismaClient,
  { userId, date }: { userId: string | null; date: Date },
) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const tomorrowEnd = new Date(dayEnd.getTime() + 24 * 60 * 60 * 1000);

  const userFilter = userId ? { userId } : {};
  const assigneeFilter = userId ? { assignedToId: userId } : {};
  const createdByFilter = userId ? { createdById: userId } : {};

  const [
    tasksCompletedToday,
    vendorsContactedToday,
    newVendorsToday,
    pendingTasks,
    dueTomorrow,
    topInteractions,
    newlyQuoted,
    newlyEngaged,
    sampleOrderedToday,
  ] = await Promise.all([
    db.task.count({
      where: {
        ...assigneeFilter,
        status: "COMPLETED",
        completedAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    db.interaction.findMany({
      where: {
        ...userFilter,
        occurredAt: { gte: dayStart, lte: dayEnd },
      },
      include: { vendor: { include: { phones: { take: 1 } } } },
      distinct: ["vendorId"],
    }),
    db.vendor.findMany({
      where: {
        ...createdByFilter,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    db.task.count({
      where: { ...assigneeFilter, status: "PENDING" },
    }),
    db.task.findMany({
      where: {
        ...assigneeFilter,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { gte: dayEnd, lte: tomorrowEnd },
      },
      include: { vendor: true },
      take: 10,
    }),
    db.interaction.findMany({
      where: {
        ...userFilter,
        occurredAt: { gte: dayStart, lte: dayEnd },
      },
      include: { vendor: { include: { phones: { take: 1 } } } },
      orderBy: { occurredAt: "desc" },
      take: 5,
    }),
    db.vendor.findMany({
      where: { status: "CATALOG_RECEIVED", updatedAt: { gte: dayStart, lte: dayEnd } },
      take: 10,
    }),
    db.vendor.findMany({
      where: { status: "CONTACTED", updatedAt: { gte: dayStart, lte: dayEnd } },
      take: 10,
    }),
    db.vendor.count({
      where: { status: "ORDER_PLACED", updatedAt: { gte: dayStart, lte: dayEnd } },
    }),
  ]);

  const interactionsCount = await db.interaction.count({
    where: { ...userFilter, occurredAt: { gte: dayStart, lte: dayEnd } },
  });

  return {
    date,
    tasksCompletedToday,
    vendorsContactedToday: vendorsContactedToday.length,
    interactionsCount,
    newVendorsToday: newVendorsToday.length,
    newVendorsList: newVendorsToday,
    pendingTasks,
    dueTomorrow,
    topInteractions,
    newlyQuoted,
    newlyEngaged,
    sampleOrderedToday,
  };
}

export function formatDailyReportText(
  d: Awaited<ReturnType<typeof buildDailyReport>>,
  userName?: string,
): string {
  const dateStr = format(d.date, "yyyy-MM-dd");
  const lines: string[] = [];
  lines.push(`STATUS REPORT — ${dateStr}${userName ? ` — ${userName}` : ""}`);
  lines.push("");
  lines.push("What I did today:");
  lines.push(`- Calls/visits/DMs: ${d.interactionsCount}`);
  lines.push(`- Tasks completed: ${d.tasksCompletedToday}`);
  lines.push(`- Vendors contacted: ${d.vendorsContactedToday}`);
  lines.push(`- New vendors added: ${d.newVendorsToday}`);
  lines.push(`- Catalogs received: ${d.newlyQuoted.length}`);
  lines.push(`- Newly contacted: ${d.newlyEngaged.length}`);
  if (d.sampleOrderedToday) lines.push(`- Orders placed: ${d.sampleOrderedToday}`);
  lines.push("");
  if (d.topInteractions.length > 0) {
    lines.push("Top calls/visits today:");
    for (const i of d.topInteractions) {
      const phone = i.vendor.phones[0]?.phone ?? "—";
      const outcome = i.outcome ? ` (${i.outcome})` : "";
      lines.push(`- ${i.vendor.name} · ${phone}${outcome}`);
    }
    lines.push("");
  }
  lines.push(`Pending: ${d.pendingTasks} tasks`);
  if (d.dueTomorrow.length > 0) {
    lines.push("");
    lines.push("Due tomorrow:");
    for (const t of d.dueTomorrow) {
      lines.push(`- ${t.title} · ${t.vendor?.name ?? "—"}`);
    }
  }
  return lines.join("\n");
}

export async function buildWeeklyReport(
  db: PrismaClient,
  { weekOf }: { weekOf: Date },
) {
  const weekStart = startOfWeek(weekOf, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekOf, { weekStartsOn: 1 });

  const [
    tasksCompletedByUser,
    vendorsByStatus,
    interactionsByVendor,
    pendingDecisions,
    sampleOrders,
  ] = await Promise.all([
    db.task.groupBy({
      by: ["assignedToId"],
      where: {
        status: "COMPLETED",
        completedAt: { gte: weekStart, lte: weekEnd },
      },
      _count: { _all: true },
    }),
    db.vendor.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.interaction.groupBy({
      by: ["vendorId"],
      where: { occurredAt: { gte: weekStart, lte: weekEnd } },
      _count: { _all: true },
      orderBy: { _count: { vendorId: "desc" } },
      take: 5,
    }),
    db.task.findMany({
      where: {
        OR: [{ status: "BLOCKED" }, { type: "SAMPLE_ORDER", status: "PENDING" }],
      },
      include: { vendor: true },
      take: 10,
    }),
    db.purchaseOrder.findMany({
      where: { orderedAt: { gte: weekStart, lte: weekEnd } },
      include: { vendor: true, product: true },
      orderBy: { orderedAt: "desc" },
    }),
  ]);

  // Map vendorIds → vendor for top interactions
  const topInteractionVendors = await db.vendor.findMany({
    where: { id: { in: interactionsByVendor.map((i) => i.vendorId) } },
  });

  return {
    weekStart,
    weekEnd,
    tasksCompletedByUser,
    vendorsByStatus,
    topInteractedVendors: interactionsByVendor.map((i) => ({
      vendor: topInteractionVendors.find((v) => v.id === i.vendorId),
      count: i._count._all,
    })),
    pendingDecisions,
    sampleOrders,
  };
}

export function formatWeeklyReportText(
  d: Awaited<ReturnType<typeof buildWeeklyReport>>,
): string {
  const range = `${format(d.weekStart, "MMM d")}–${format(d.weekEnd, "MMM d")}`;
  const lines: string[] = [];
  lines.push(`WEEKLY SUMMARY — ${range}`);
  lines.push("");
  lines.push("Tasks completed by:");
  for (const t of d.tasksCompletedByUser) {
    lines.push(`- ${t.assignedToId ?? "Unassigned"}: ${t._count._all}`);
  }
  lines.push("");
  lines.push("Vendors by status (snapshot):");
  for (const s of d.vendorsByStatus) {
    lines.push(`- ${s.status}: ${s._count._all}`);
  }
  lines.push("");
  lines.push("Top 5 vendors interacted with this week:");
  for (const t of d.topInteractedVendors) {
    if (!t.vendor) continue;
    lines.push(`- ${t.vendor?.name ?? "—"}: ${t.count} interactions`);
  }
  if (d.pendingDecisions.length > 0) {
    lines.push("");
    lines.push("Pending decisions (need a partner):");
    for (const td of d.pendingDecisions) {
      lines.push(`- ${td.title} · ${td.vendor?.name ?? "—"}`);
    }
  }
  if (d.sampleOrders.length > 0) {
    lines.push("");
    lines.push("Sample orders this week:");
    for (const po of d.sampleOrders) {
      lines.push(`- ${po.vendor.name} · ${po.quantity}× ₹${po.unitCost} = ₹${po.totalCost} (${po.status})`);
    }
  }
  return lines.join("\n");
}
