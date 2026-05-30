export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-neutral-800 px-4 pt-4 pb-3">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-neutral-800" />
        <div className="mt-2 h-3 w-28 rounded bg-slate-200 dark:bg-neutral-800" />
      </div>
      <div className="px-4 pt-5 pb-28 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-200 dark:bg-neutral-800"
            />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-slate-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
