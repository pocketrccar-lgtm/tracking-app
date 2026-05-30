"use client";

import * as React from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] flex flex-col">
          <div className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
          {title ? (
            <Drawer.Title className="px-4 pb-2 text-sm font-semibold border-b border-gray-100 dark:border-gray-800">
              {title}
            </Drawer.Title>
          ) : (
            <Drawer.Title className="sr-only">Menu</Drawer.Title>
          )}
          <div className="overflow-y-auto overscroll-contain px-4 pb-8 pt-2 flex-1">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

interface ActionItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export function ActionItem({
  icon,
  label,
  href,
  onClick,
  destructive,
}: ActionItemProps) {
  const rowClass = cn(
    "flex items-center gap-3 w-full rounded-xl px-3 py-3 text-left active:scale-[0.98] transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
    destructive && "text-red-600 dark:text-red-500"
  );

  const iconWrap = cn(
    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
    destructive
      ? "bg-red-50 dark:bg-red-950/30 text-red-600"
      : "bg-red-50 dark:bg-red-950/30 text-red-600"
  );

  const inner = (
    <>
      <span className={iconWrap}>{icon}</span>
      <span className="font-medium">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {inner}
    </button>
  );
}
