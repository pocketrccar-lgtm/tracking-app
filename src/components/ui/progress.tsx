import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  className?: string
}

function Progress({ value, max = 100, className }: ProgressProps) {
  const safeMax = max > 0 ? max : 100
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      className={cn("h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden", className)}
    >
      <div
        data-slot="progress-fill"
        className="h-full rounded-full bg-amber-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
