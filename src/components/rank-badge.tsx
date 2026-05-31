// Small "#N" rank chip. Top-3 = gold, top-10 = red, rest = slate.
export function RankBadge({
  rank,
  className = "",
}: {
  rank?: number | null;
  className?: string;
}) {
  if (!rank) return null;
  const tone =
    rank <= 3
      ? "bg-amber-400 text-white"
      : rank <= 10
        ? "bg-red-600 text-white"
        : "bg-slate-200 text-slate-700";
  return (
    <span
      className={`inline-flex h-6 min-w-[1.6rem] items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums ${tone} ${className}`}
    >
      #{rank}
    </span>
  );
}
