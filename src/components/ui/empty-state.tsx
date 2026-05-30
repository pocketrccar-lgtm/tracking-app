import * as React from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon ? (
        <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:text-red-500">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-[280px]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
