"use client";

type Props = {
  carbs: number;
  protein: number;
  fat: number;
  sugar?: number;
  sodium_mg?: number;
  size?: number;
};

export function StatsDonut({
  carbs,
  protein,
  fat,
  sugar = 0,
  sodium_mg = 0,
  size = 80,
}: Props) {
  const sodiumScaled = sodium_mg / 20;
  const total = carbs + protein + fat + sugar + sodiumScaled;
  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-600 dark:text-zinc-500"
        style={{ width: size, height: size }}
      >
        —
      </div>
    );
  }
  const c = (carbs / total) * 100;
  const p = (protein / total) * 100;
  const f = (fat / total) * 100;
  const s = (sugar / total) * 100;
  const na = (sodiumScaled / total) * 100;
  const r = size / 2;
  const circ = 2 * Math.PI * (r - 4);
  const dashC = (c / 100) * circ;
  const dashP = (p / 100) * circ;
  const dashF = (f / 100) * circ;
  const dashS = (s / 100) * circ;
  const dashNa = (na / 100) * circ;

  const segments = [
    { dash: dashC, offset: 0, color: "#e4a853", label: "탄수화물", pct: c },
    { dash: dashP, offset: dashC, color: "#22c55e", label: "단백질", pct: p },
    { dash: dashF, offset: dashC + dashP, color: "#3b82f6", label: "지방", pct: f },
    { dash: dashS, offset: dashC + dashP + dashF, color: "#a855f7", label: "당", pct: s },
    { dash: dashNa, offset: dashC + dashP + dashF + dashS, color: "#64748b", label: "나트륨", pct: na },
  ].filter((seg) => seg.pct >= 0.5);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={r}
            cy={r}
            r={r - 4}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${seg.dash} ${circ}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xs">
        {c >= 0.5 && <span className="text-amber-600 dark:text-amber-500">탄수화물 {c.toFixed(0)}%</span>}
        {p >= 0.5 && <span className="text-green-600 dark:text-green-500">단백질 {p.toFixed(0)}%</span>}
        {f >= 0.5 && <span className="text-blue-600 dark:text-blue-500">지방 {f.toFixed(0)}%</span>}
        {s >= 0.5 && <span className="text-violet-600 dark:text-violet-400">당 {s.toFixed(0)}%</span>}
        {na >= 0.5 && <span className="text-slate-600 dark:text-slate-400">나트륨 {na.toFixed(0)}%</span>}
      </div>
    </div>
  );
}
