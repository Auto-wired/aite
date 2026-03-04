"use client";

type DailyRef = {
  kcal: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  sugar_g: number;
  sodium_mg: number;
};

type Props = {
  kcal: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  sugar_g: number;
  sodium_mg: number;
  daily: DailyRef;
};

function BarRow({
  label,
  current,
  refVal,
  unit,
}: {
  label: string;
  current: number;
  refVal: number;
  unit: string;
}) {
  const pct = refVal > 0 ? Math.round((current / refVal) * 100) : 0;
  const widthPct = Math.min(100, pct);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {pct}%
          {unit && (
            <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
              ({current}
              {unit})
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-zinc-600 dark:bg-zinc-400"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

export function StatsDailyBar({
  kcal,
  carbs_g,
  protein_g,
  fat_g,
  sugar_g,
  sodium_mg,
  daily,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <BarRow label="칼로리" current={Math.round(kcal)} refVal={daily.kcal} unit=" kcal" />
      <BarRow label="탄수화물" current={Math.round(carbs_g)} refVal={daily.carbs_g} unit="g" />
      <BarRow label="단백질" current={Math.round(protein_g)} refVal={daily.protein_g} unit="g" />
      <BarRow label="지방" current={Math.round(fat_g)} refVal={daily.fat_g} unit="g" />
      <BarRow label="당" current={Math.round(sugar_g)} refVal={daily.sugar_g} unit="g" />
      <BarRow label="나트륨" current={Math.round(sodium_mg)} refVal={daily.sodium_mg} unit="mg" />
    </div>
  );
}
