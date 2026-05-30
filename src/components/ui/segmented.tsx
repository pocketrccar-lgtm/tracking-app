"use client"

import { cn } from "@/lib/utils"

interface SegmentedOption {
  value: string
  label: string
}

interface SegmentedProps {
  options: SegmentedOption[]
  value: string
  onValueChange: (v: string) => void
  className?: string
}

function Segmented({ options, value, onValueChange, className }: SegmentedProps) {
  return (
    <div
      data-slot="segmented"
      role="tablist"
      className={cn(
        "flex bg-slate-100 dark:bg-gray-800 rounded-xl p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "flex-1 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all",
              active
                ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-slate-400"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
