import { StatsDonut } from "@/components/stats-donut";
import { StatsDailyBar } from "@/components/stats-daily-bar";
import { StatsCategoryDonut } from "@/components/stats-category-donut";
import { getDailyRecommended } from "@/lib/nutrition";
import type { Profile } from "@/app/account/actions";

type Props = {
  profile: Profile | null;
  count: number;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium_mg: number;
  categoryCounts: Record<string, number>;
};

export function DayStatsPanel({
  profile,
  count,
  kcal,
  carbs,
  protein,
  fat,
  sugar,
  sodium_mg,
  categoryCounts,
}: Props) {
  const daily = getDailyRecommended(profile);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      <h2 className="mb-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        오늘 하루 통계
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {/* 1. 식단 기록 */}
        <div className="flex min-h-[140px] flex-col rounded-xl border border-zinc-100 p-3 dark:border-zinc-800 sm:min-h-[160px] sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            식단 기록
          </p>
          <ul className="mt-2 space-y-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>식단: {count}개</li>
            <li>칼로리: {kcal > 0 ? `${Math.round(kcal)} kcal` : "—"}</li>
            <li>탄수화물: {carbs > 0 ? `${Math.round(carbs)} g` : "—"}</li>
            <li>단백질: {protein > 0 ? `${Math.round(protein)} g` : "—"}</li>
            <li>지방: {fat > 0 ? `${Math.round(fat)} g` : "—"}</li>
            <li>당: {sugar > 0 ? `${Math.round(sugar)} g` : "—"}</li>
            <li>나트륨: {sodium_mg > 0 ? `${Math.round(sodium_mg)} mg` : "—"}</li>
          </ul>
        </div>
        {/* 2. 하루 권장량 대비 */}
        <div className="flex min-h-[140px] flex-col justify-between rounded-xl border border-zinc-100 p-3 dark:border-zinc-800 sm:min-h-[160px] sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            하루 권장량 대비
          </p>
          <div className="mt-2 flex-1 overflow-auto">
            <StatsDailyBar
              kcal={kcal}
              carbs_g={carbs}
              protein_g={protein}
              fat_g={fat}
              sugar_g={sugar}
              sodium_mg={sodium_mg}
              daily={daily}
            />
          </div>
        </div>
        {/* 3. 영양 성분 비율 */}
        <div className="flex min-h-[140px] flex-col justify-between rounded-xl border border-zinc-100 p-3 dark:border-zinc-800 sm:min-h-[160px] sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            영양 성분 비율
          </p>
          <div className="mt-2 flex flex-1 justify-center">
            <StatsDonut
              carbs={carbs}
              protein={protein}
              fat={fat}
              sugar={sugar}
              sodium_mg={sodium_mg}
              size={80}
            />
          </div>
        </div>
        {/* 4. 카테고리별 음식 비율 */}
        <div className="flex min-h-[140px] flex-col justify-between rounded-xl border border-zinc-100 p-3 dark:border-zinc-800 sm:min-h-[160px] sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            카테고리별 음식 비율
          </p>
          <div className="mt-2 flex flex-1 items-center justify-center">
            <StatsCategoryDonut categoryCounts={categoryCounts} size={80} />
          </div>
        </div>
      </div>
    </section>
  );
}
