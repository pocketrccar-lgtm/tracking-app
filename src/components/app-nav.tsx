"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Package,
  ShoppingCart,
  FileText,
  Tag,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/products", label: "Products", icon: Package },
  { href: "/purchase-orders", label: "POs", icon: ShoppingCart },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/categories", label: "Categories", icon: Tag },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              BCH
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Sourcing OS
              </div>
              <div className="text-xs text-slate-500">RC car vendor CRM</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <div className="mt-3 text-xs text-slate-400">
            v0.1 · sqlite dev mode
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden">
        <div className="grid grid-cols-7">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  active ? "text-emerald-600" : "text-slate-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold">
            BCH
          </div>
          <div className="text-sm font-semibold">Sourcing OS</div>
        </Link>
      </header>
    </>
  );
}
