"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  VENDOR_STATUSES,
  VENDOR_TIERS,
  VENDOR_TYPES,
  VENDOR_STATUS_LABELS,
  VENDOR_TIER_LABELS,
  VENDOR_TYPE_LABELS,
} from "@/lib/enums";
import {
  updateVendorStatus,
  updateVendorTier,
  updateVendorType,
  deleteVendor,
} from "@/actions/vendors";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20";

export function VendorControls({
  vendorId,
  vendorName,
  status,
  tier,
  type,
}: {
  vendorId: string;
  vendorName: string;
  status: string;
  tier: string;
  type: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const change = (
    action: (id: string, v: string) => Promise<void>,
    value: string,
    label: string,
  ) => {
    startTransition(async () => {
      try {
        await action(vendorId, value);
        toast.success(`${label} updated`);
        router.refresh();
      } catch {
        toast.error(`Failed to update ${label.toLowerCase()}`);
      }
    });
  };

  const doDelete = () => {
    setDeleting(true);
    startTransition(async () => {
      try {
        await deleteVendor(vendorId); // redirects to /vendors
      } catch {
        toast.error("Failed to delete");
        setDeleting(false);
        setConfirmOpen(false);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Status
          </label>
          <select
            defaultValue={status}
            onChange={(e) => change(updateVendorStatus, e.target.value, "Status")}
            className={selectClass}
          >
            {VENDOR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VENDOR_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tier
          </label>
          <select
            defaultValue={tier}
            onChange={(e) => change(updateVendorTier, e.target.value, "Tier")}
            className={selectClass}
          >
            {VENDOR_TIERS.map((t) => (
              <option key={t} value={t}>
                {VENDOR_TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Type
          </label>
          <select
            defaultValue={type}
            onChange={(e) => change(updateVendorType, e.target.value, "Type")}
            className={selectClass}
          >
            {VENDOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {VENDOR_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        variant="destructive"
        onClick={() => setConfirmOpen(true)}
        className="w-full"
      >
        <Trash2 className="h-4 w-4" /> Delete vendor
      </Button>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${vendorName}?`}
        description="This permanently removes the vendor and all its phones, tasks, products and POs. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={doDelete}
        loading={deleting}
      />
    </div>
  );
}
