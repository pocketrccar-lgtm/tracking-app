"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  VENDOR_STATUS_FUNNEL,
  VENDOR_TIERS,
  VENDOR_TYPES,
  VENDOR_STATUS_LABELS,
  VENDOR_TIER_LABELS,
  VENDOR_TYPE_LABELS,
  type VendorStatus,
} from "@/lib/enums";
import {
  updateVendorStatus,
  updateVendorTier,
  updateVendorType,
  deleteVendor,
} from "@/actions/vendors";
import { toast } from "sonner";
import { Trash2, Check } from "lucide-react";

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
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dropped = current === "WASTE_LEAD";
  const currentIndex = (VENDOR_STATUS_FUNNEL as readonly string[]).indexOf(
    current,
  );

  const setStatus = (value: string) => {
    if (value === current) return;
    const prev = current;
    setCurrent(value); // optimistic
    startTransition(async () => {
      try {
        await updateVendorStatus(vendorId, value);
        toast.success(`Moved to ${VENDOR_STATUS_LABELS[value as VendorStatus]}`);
        router.refresh();
      } catch {
        setCurrent(prev);
        toast.error("Failed to update status");
      }
    });
  };

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
    <div className="space-y-4">
      {/* Sourcing funnel stepper — tap a stage to move the vendor there */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sourcing stage
          </span>
          {dropped ? (
            <button
              type="button"
              onClick={() => setStatus("NEW")}
              disabled={pending}
              className="text-xs font-bold text-red-600 disabled:opacity-50"
            >
              Reactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStatus("WASTE_LEAD")}
              disabled={pending}
              className="text-xs font-semibold text-slate-400 disabled:opacity-50"
            >
              Mark waste lead
            </button>
          )}
        </div>

        {dropped ? (
          <div className="rounded-lg bg-rose-50 px-3 py-4 text-center text-sm font-semibold text-rose-500">
            Waste lead — parked, not in the funnel.
            <br />
            <span className="text-xs font-normal">
              Tap Reactivate to put them back.
            </span>
          </div>
        ) : (
          <ol>
            {VENDOR_STATUS_FUNNEL.map((st, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const isLast = i === VENDOR_STATUS_FUNNEL.length - 1;
              return (
                <li key={st} className="flex gap-3">
                  {/* circle + connector column */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        done || active
                          ? "bg-red-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    {!isLast && (
                      <span
                        className={`w-0.5 flex-1 ${
                          done ? "bg-red-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>

                  {/* tappable label */}
                  <button
                    type="button"
                    onClick={() => setStatus(st)}
                    disabled={pending}
                    className={`mb-1 flex flex-1 items-center justify-between rounded-lg px-2 py-2 text-left transition-colors active:scale-[0.99] disabled:opacity-60 ${
                      active ? "bg-red-50" : ""
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        active
                          ? "font-bold text-slate-900"
                          : done
                            ? "font-medium text-slate-600"
                            : "font-medium text-slate-400"
                      }`}
                    >
                      {VENDOR_STATUS_LABELS[st]}
                    </span>
                    {active && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        NOW
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Tier + Type + Delete */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      </div>

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
