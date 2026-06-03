export default function Loading() {
  return (
    <div className="animate-pulse px-4 pt-5 pb-36 space-y-5">
      <div className="h-4 w-28 rounded bg-slate-200" />
      {/* hero */}
      <div>
        <div className="flex gap-1.5">
          <div className="h-6 w-20 rounded-full bg-slate-100" />
          <div className="h-6 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="mt-3 h-7 w-3/4 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
      </div>
      {/* why this matters */}
      <div className="h-40 rounded-2xl bg-slate-100" />
      {/* meta */}
      <div className="h-44 rounded-2xl bg-slate-100" />
    </div>
  );
}
