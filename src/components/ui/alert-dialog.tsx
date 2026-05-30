"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  loading?: boolean;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: AlertDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Close on Escape.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onOpenChange]);

  if (!open) return null;

  const destructive = variant === "destructive";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />
      <div className="relative z-[100] bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button
            ref={cancelRef}
            type="button"
            autoFocus
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className={cn(
              "min-h-[44px] rounded-xl px-4 text-sm font-semibold transition-colors",
              "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              "disabled:opacity-50"
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "min-h-[44px] rounded-xl px-4 text-sm font-semibold text-white transition-colors",
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-red-600 hover:bg-red-700",
              "disabled:opacity-50"
            )}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
