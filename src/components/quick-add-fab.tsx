"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Plus, Users, ListTodo, Package, ShoppingCart } from "lucide-react";
import { BottomSheet, ActionItem } from "@/components/ui/bottom-sheet";

const HIDE_ON = [
  "/vendors/new",
  "/tasks/new",
  "/purchase-orders/new",
  "/products/new",
];

const actions = [
  { label: "Add vendor", href: "/vendors/new", icon: Users },
  { label: "Add task", href: "/tasks/new", icon: ListTodo },
  { label: "New product", href: "/products/new", icon: Package },
  {
    label: "New purchase order",
    href: "/purchase-orders/new",
    icon: ShoppingCart,
  },
] as const;

export function QuickAddFab() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const hidden = HIDE_ON.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Quick add"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.5rem] right-4 z-40 w-14 h-14 rounded-full bg-amber-500 shadow-lg shadow-amber-500/25 flex items-center justify-center active:scale-90 transition-transform text-white"
      >
        <Plus className="h-6 w-6" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} title="Quick add">
        <div className="space-y-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <ActionItem
                key={action.href}
                href={action.href}
                label={action.label}
                icon={<Icon className="h-5 w-5" />}
                onClick={() => setOpen(false)}
              />
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
