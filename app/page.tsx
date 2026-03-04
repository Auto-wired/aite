import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getFoodImageUrl } from "@/app/day/[date]/actions";
import { getProfile } from "@/app/account/actions";
import { AppHeader } from "@/components/app-header";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DayPageClient } from "@/components/day/day-page-client";
import { StatsPanel } from "@/components/stats-panel";

function weekStart(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + monOffset);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await getProfile(user.id);

  const now = new Date();
  const weekStartStr = weekStart(now);
  const today = todayStr();
  const params = await searchParams;
  const from = params.from?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.from : weekStartStr;
  const to = params.to?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.to : today;
  const fromDate = from <= to ? from : to;
  const toDate = from <= to ? to : from;
  const selectedDate = params.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.date : today;

  const [dateEntriesResult, rangeRows, rangeCategoryRows] = await Promise.all([
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("food_entries")
      .select("ai_kcal, ai_carbs_g, ai_protein_g, ai_fat_g, ai_sugar_g, ai_sodium_mg")
      .eq("user_id", user.id)
      .gte("date", fromDate)
      .lte("date", toDate)
      .not("ai_kcal", "is", null),
    supabase
      .from("food_entries")
      .select("ai_category")
      .eq("user_id", user.id)
      .gte("date", fromDate)
      .lte("date", toDate),
  ]);

  const rangeCount =
    (await supabase
      .from("food_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", fromDate)
      .lte("date", toDate)).count ?? 0;

  const rangeData = (rangeRows.data ?? []).reduce(
    (acc, row) => ({
      count: acc.count + 1,
      kcal: acc.kcal + (Number(row.ai_kcal) || 0),
      carbs: acc.carbs + (Number(row.ai_carbs_g) || 0),
      protein: acc.protein + (Number(row.ai_protein_g) || 0),
      fat: acc.fat + (Number(row.ai_fat_g) || 0),
      sugar: acc.sugar + (Number(row.ai_sugar_g) || 0),
      sodium_mg: acc.sodium_mg + (Number(row.ai_sodium_mg) || 0),
    }),
    { count: 0, kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium_mg: 0 }
  );

  const categoryCounts: Record<string, number> = {};
  for (const row of rangeCategoryRows.data ?? []) {
    const c = row.ai_category?.trim?.() || "(미분류)";
    categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;
  }

  const rangeDays = Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (24 * 60 * 60 * 1000)) + 1);

  const dateEntries = dateEntriesResult.data ?? [];
  const dateEntriesWithUrls = await Promise.all(
    dateEntries.map(async (e) => {
      let image_url: string | null = null;
      if (e.image_path) {
        image_url = await getFoodImageUrl(e.image_path);
      }
      return { ...e, image_url };
    })
  );

  const dayStats = dateEntries.reduce(
    (acc, e) => ({
      count: acc.count + 1,
      kcal: acc.kcal + (Number(e.ai_kcal) || 0),
      carbs: acc.carbs + (Number(e.ai_carbs_g) || 0),
      protein: acc.protein + (Number(e.ai_protein_g) || 0),
      fat: acc.fat + (Number(e.ai_fat_g) || 0),
      sugar: acc.sugar + (Number(e.ai_sugar_g) || 0),
      sodium_mg: acc.sodium_mg + (Number(e.ai_sodium_mg) || 0),
    }),
    { count: 0, kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium_mg: 0 }
  );

  const dayCategoryCounts: Record<string, number> = {};
  for (const e of dateEntries) {
    const c = e.ai_category?.trim?.() || "(미분류)";
    dayCategoryCounts[c] = (dayCategoryCounts[c] ?? 0) + 1;
  }

  const selectedDateLabel = (() => {
    const d = new Date(selectedDate + "T12:00:00");
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  })();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} profile={profile} />
      <main className="flex-1 p-3 sm:p-4 lg:grid lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-6 lg:p-6">
        {/* 왼쪽 상단: 캘린더 / 왼쪽 하단: 통계 */}
        <div className="flex w-full flex-col gap-4 overflow-visible lg:gap-6">
          <section className="w-full overflow-visible">
            <MonthCalendar selectedDate={selectedDate} />
          </section>
          <section className="w-full overflow-visible">
            <Suspense fallback={<div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">통계 로딩 중…</div>}>
              <StatsPanel
                profile={profile}
                selectedDate={selectedDate}
                dayCount={dayStats.count}
                dayKcal={dayStats.kcal}
                dayCarbs={dayStats.carbs}
                dayProtein={dayStats.protein}
                dayFat={dayStats.fat}
                daySugar={dayStats.sugar}
                daySodium_mg={dayStats.sodium_mg}
                dayCategoryCounts={dayCategoryCounts}
                from={fromDate}
                to={toDate}
                rangeCount={rangeCount}
                rangeKcal={rangeData.kcal}
                rangeCarbs={rangeData.carbs}
                rangeProtein={rangeData.protein}
                rangeFat={rangeData.fat}
                rangeSugar={rangeData.sugar}
                rangeSodium_mg={rangeData.sodium_mg}
                rangeDays={rangeDays}
                categoryCounts={categoryCounts}
              />
            </Suspense>
          </section>
        </div>
        {/* 오른쪽 전체: 식단 리스트 */}
        <div className="mt-4 min-w-0 lg:mt-0">
          <section className="w-full overflow-visible rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
            <Suspense fallback={<div className="py-4 text-sm text-zinc-500">식단 로딩 중…</div>}>
              <DayPageClient
                date={selectedDate}
                userId={user.id}
                entries={dateEntriesWithUrls}
                profile={profile}
                title={selectedDateLabel}
              />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}
