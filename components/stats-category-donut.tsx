"use client";

const CATEGORY_COLORS = [
  "#e4a853",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#64748b",
  "#f43f5e",
  "#14b8a6",
  "#f59e0b",
];

type Props = {
  categoryCounts: Record<string, number>;
  size?: number;
};

export function StatsCategoryDonut({ categoryCounts, size = 80 }: Props) {
  const entries = Object.entries(categoryCounts).filter(([, n]) => n > 0);
  const total = entries.reduce((s, [, n]) => s + n, 0);

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

  const r = size / 2;
  const circ = 2 * Math.PI * (r - 4);
  const segments = entries.map(([label, count], i) => ({
    label,
    count,
    pct: (count / total) * 100,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  let offset = 0;
  const circles = segments.map((seg) => {
    const dash = (seg.pct / 100) * circ;
    const o = offset;
    offset += dash;
    return { ...seg, dash, offset: o };
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {circles.map((seg, i) => (
          <circle
            key={seg.label}
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
        {circles.map((seg) => (
          <span
            key={seg.label}
            style={{ color: seg.color }}
            className="font-medium"
          >
            {seg.label} {seg.pct.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}
