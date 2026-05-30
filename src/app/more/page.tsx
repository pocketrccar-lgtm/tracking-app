import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  ShoppingCart,
  FileText,
  Tag,
  ChevronRight,
  Users,
  Package,
  ListTodo,
  MessageCircle,
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Item = {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Operations",
    items: [
      {
        href: "/purchase-orders",
        label: "Purchase Orders",
        desc: "Samples + bulk POs and their status",
        icon: ShoppingCart,
      },
      {
        href: "/reports",
        label: "Reports",
        desc: "Daily WhatsApp + weekly summaries",
        icon: FileText,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        href: "/vendors",
        label: "Vendors",
        desc: "All supply-side vendors",
        icon: Users,
      },
      {
        href: "/products",
        label: "Products",
        desc: "SKUs + price history",
        icon: Package,
      },
      {
        href: "/tasks",
        label: "Tasks",
        desc: "Calls, visits, follow-ups",
        icon: ListTodo,
      },
    ],
  },
  {
    title: "Setup",
    items: [
      {
        href: "/categories",
        label: "Categories",
        desc: "Verticals — RC cars, helmets, fitness…",
        icon: Tag,
      },
      {
        href: "/playbooks",
        label: "Research playbooks",
        desc: "Apify / YouTube / Gemini / Zauba funnels — editable",
        icon: Compass,
      },
    ],
  },
];

export default function MorePage() {
  return (
    <div>
      <PageHeader title="More" subtitle="Operations, setup & appearance" />
      <div className="px-4 pt-5 pb-28 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="px-1 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-slate-100 dark:divide-neutral-800">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 min-h-[44px] active:scale-[0.99] transition-transform"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 text-red-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                        {item.desc}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-neutral-600" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <h2 className="px-1 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Settings
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            <Link
              href="/templates"
              className="flex items-center gap-3 px-4 py-3.5 min-h-[44px] active:scale-[0.99] transition-transform"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  WhatsApp message templates
                </div>
                <div className="text-xs text-slate-500 truncate">
                  Edit the catalog-request message sent to vendors
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          </div>
        </div>

        <p className="px-1 text-center text-xs text-slate-400">
          Pocket RC Cars · pokketrccar.com
        </p>
      </div>
    </div>
  );
}
