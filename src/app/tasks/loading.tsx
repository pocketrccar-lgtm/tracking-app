export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* header */}
      <div className="px-4 pt-4 pb-3">
        <div className="h-6 w-28 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-36 rounded bg-slate-200" />
      </div>
      <div className="px-4 pt-5 pb-28 space-y-3">
        {/* view toggle + segment */}
        <div className="h-11 rounded-xl bg-slate-100" />
        <div className="h-11 rounded-xl bg-slate-100" />
        {/* horizon chips */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-full bg-slate-100" />
          ))}
        </div>
        {/* rows */}
        <div className="space-y-2 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
