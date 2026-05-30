"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Package,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/products", label: "Products", icon: Package },
  { href: "/more", label: "More", icon: Menu },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-neutral-800 pb-safe">
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold min-h-[56px] transition-colors",
                active
                  ? "text-red-600 dark:text-red-500"
                  : "text-slate-400 dark:text-neutral-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 -mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
