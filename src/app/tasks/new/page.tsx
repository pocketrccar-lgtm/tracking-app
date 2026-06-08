import { db } from "@/lib/db";
import { NewTaskClient } from "@/components/new-task-client";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  const { vendorId } = await searchParams;
  const [vendors, users] = await Promise.all([
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  // Auto-assign new tasks to the account owner (Syed) by default; AI/voice can override.
  const defaultAssigneeId =
    users.find((u) => /syed/i.test(u.name) && !/shared/i.test(u.name))?.id ??
    users.find((u) => u.role !== "advisor")?.id;

  return (
    <div>
      <PageHeader title="New task" subtitle="Speak it, or fill the form" />
      <div className="px-4 pt-5 pb-28 space-y-4">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm text-slate-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
        </Link>
        <NewTaskClient
          vendors={vendors}
          users={users}
          defaultVendorId={vendorId}
          defaultAssigneeId={defaultAssigneeId}
        />
      </div>
    </div>
  );
}
