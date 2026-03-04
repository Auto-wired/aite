"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatsDonut } from "@/components/stats-donut";
import { StatsDailyBar } from "@/components/stats-daily-bar";
import { StatsCategoryDonut } from "@/components/stats-category-donut";
import type { Profile } from "@/app/account/actions";
import { getDailyRecommended } from "@/lib/nutrition";

type Props = {
  profile: Profile | null;
  selectedDate: string;
  dayCount: number;
  dayKcal: number;
  dayCarbs: number;
  dayProtein: number;
  dayFat: number;
  daySugar: number;
  daySodium_mg: number;
  dayCategoryCounts: Record<string, number>;
  from: string;
  to: string;
  rangeCount: number;
  rangeKcal: number;
  rangeCarbs: number;
  rangeProtein: number;
  rangeFat: number;
  rangeSugar: number;
  rangeSodium_mg: number;
  rangeDays: number;
  categoryCounts: Record<string, number>;
};

type StatBox =
  | { label: string; value: string }
  | {
      label: string;
      summary: true;
      count: number;
      kcal: number;
      carbs: number;
      protein: number;
      fat: number;
      sugar: number;
      sodium_mg: number;
    }
  | {
      label: string;
      donut: true;
      carbs: number;
      protein: number;
      fat: number;
      sugar: number;
      sodium_mg: number;
    }
  | {
      label: string;
      dailyBar: true;
      kcal: number;
      carbs_g: number;
      protein_g: number;
      fat_g: number;
      sugar_g: number;
      sodium_mg: number;
      daily: ReturnType<typeof getDailyRecommended>;
    }
  | {
      label: string;
      categoryDonut: true;
      categoryCounts: Record<string, number>;
    };

function StatCube({ box }: { box: StatBox }) {
  const isSummary = "summary" in box && box.summary;
  return (
    <div
      className={`flex min-h-[140px] flex-col rounded-xl border border-zinc-100 p-3 dark:border-zinc-800 sm:min-h-[160px] sm:p-4 ${isSummary ? "" : "justify-between"}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {box.label}
      </p>
      {"summary" in box && box.summary ? (
        <ul className="mt-2 space-y-0.5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>식단: {box.count}개</li>
          <li>칼로리: {box.kcal > 0 ? `${Math.round(box.kcal)} kcal` : "—"}</li>
          <li>탄수화물: {box.carbs > 0 ? `${Math.round(box.carbs)} g` : "—"}</li>
          <li>단백질: {box.protein > 0 ? `${Math.round(box.protein)} g` : "—"}</li>
          <li>지방: {box.fat > 0 ? `${Math.round(box.fat)} g` : "—"}</li>
          <li>당: {box.sugar > 0 ? `${Math.round(box.sugar)} g` : "—"}</li>
          <li>나트륨: {box.sodium_mg > 0 ? `${Math.round(box.sodium_mg)} mg` : "—"}</li>
        </ul>
      ) : "donut" in box && box.donut ? (
        <div className="mt-2 flex flex-1 justify-center">
          <StatsDonut
            carbs={box.carbs}
            protein={box.protein}
            fat={box.fat}
            sugar={box.sugar}
            sodium_mg={box.sodium_mg}
            size={80}
          />
        </div>
      ) : "dailyBar" in box && box.dailyBar ? (
        <div className="mt-2 flex-1 overflow-auto">
          <StatsDailyBar
            kcal={box.kcal}
            carbs_g={box.carbs_g}
            protein_g={box.protein_g}
            fat_g={box.fat_g}
            sugar_g={box.sugar_g}
            sodium_mg={box.sodium_mg}
            daily={box.daily}
          />
        </div>
      ) : "categoryDonut" in box && box.categoryDonut ? (
        <div className="mt-2 flex flex-1 items-center justify-center">
          <StatsCategoryDonut categoryCounts={box.categoryCounts} size={80} />
        </div>
      ) : (
        <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          {box.value}
        </p>
      )}
    </div>
  );
}

export function StatsPanel(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"daily" | "range">("daily");
  const dailyRec = getDailyRecommended(props.profile);
  const rangeDays = Math.max(1, props.rangeDays);

  const dailyBoxes: StatBox[] = [
    {
      label: "식단 기록",
      summary: true,
      count: props.dayCount,
      kcal: props.dayKcal,
      carbs: props.dayCarbs,
      protein: props.dayProtein,
      fat: props.dayFat,
      sugar: props.daySugar,
      sodium_mg: props.daySodium_mg,
    },
    {
      label: "하루 권장량 대비",
      dailyBar: true,
      kcal: props.dayKcal,
      carbs_g: props.dayCarbs,
      protein_g: props.dayProtein,
      fat_g: props.dayFat,
      sugar_g: props.daySugar,
      sodium_mg: props.daySodium_mg,
      daily: dailyRec,
    },
    {
      label: "영양 성분 비율",
      donut: true,
      carbs: props.dayCarbs,
      protein: props.dayProtein,
      fat: props.dayFat,
      sugar: props.daySugar,
      sodium_mg: props.daySodium_mg,
    },
    {
      label: "카테고리별 음식 비율",
      categoryDonut: true,
      categoryCounts: props.dayCategoryCounts,
    },
  ];

  const rangeBoxes: StatBox[] = [
    {
      label: "식단 기록",
      summary: true,
      count: props.rangeCount,
      kcal: props.rangeKcal,
      carbs: props.rangeCarbs,
      protein: props.rangeProtein,
      fat: props.rangeFat,
      sugar: props.rangeSugar,
      sodium_mg: props.rangeSodium_mg,
    },
    {
      label: "하루 권장량 대비 (일 평균)",
      dailyBar: true,
      kcal: props.rangeKcal / rangeDays,
      carbs_g: props.rangeCarbs / rangeDays,
      protein_g: props.rangeProtein / rangeDays,
      fat_g: props.rangeFat / rangeDays,
      sugar_g: props.rangeSugar / rangeDays,
      sodium_mg: props.rangeSodium_mg / rangeDays,
      daily: dailyRec,
    },
    {
      label: "영양 성분 비율",
      donut: true,
      carbs: props.rangeCarbs,
      protein: props.rangeProtein,
      fat: props.rangeFat,
      sugar: props.rangeSugar,
      sodium_mg: props.rangeSodium_mg,
    },
    {
      label: "카테고리별 음식 비율",
      categoryDonut: true,
      categoryCounts: props.categoryCounts,
    },
  ];

  const boxes = tab === "daily" ? dailyBoxes : rangeBoxes;

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const from = (form.elements.namedItem("from") as HTMLInputElement).value;
    const to = (form.elements.namedItem("to") as HTMLInputElement).value;
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`?${params.toString()}`);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            통계
          </h2>
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setTab("daily")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === "daily"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              일간
            </button>
            <button
              type="button"
              onClick={() => setTab("range")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === "range"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              전체
            </button>
          </div>
        </div>
        {tab === "range" && (
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="from"
              defaultValue={props.from}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="date"
              name="to"
              defaultValue={props.to}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              검색
            </button>
          </form>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {boxes.map((box, i) => (
          <StatCube key={i} box={box} />
        ))}
      </div>
    </section>
  );
}
