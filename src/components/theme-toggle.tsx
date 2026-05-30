"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder keeps layout stable and avoids hydration mismatch.
    return (
      <div
        aria-hidden
        className="flex gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 h-[44px]"
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-red-600 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
