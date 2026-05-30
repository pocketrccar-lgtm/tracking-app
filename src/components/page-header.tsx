import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[#fafafa]/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 px-4 pt-4 pb-3">
      <div className="flex items-start justify-between gap-3 max-w-lg mx-auto">
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
