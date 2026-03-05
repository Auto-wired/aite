"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { AddFoodForm } from "@/components/day/add-food-form";
import { FoodDetailForm } from "@/components/day/food-detail-form";
import { deleteFoodEntry } from "@/app/day/[date]/actions";
import { getDailyRecommended } from "@/lib/nutrition";
import type { FoodEntry } from "@/types/db";
import type { Profile } from "@/app/account/actions";

type EntryWithUrl = FoodEntry & { image_url?: string | null };

function pct(value: number, base: number): number {
  if (base <= 0) return 0;
  return Math.round((value / base) * 100);
}

function formatEntryDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = d.getMinutes();
  const sec = d.getSeconds();
  return `${y}. ${m}. ${day} ${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

type Props = {
  date: string;
  userId: string;
  entries: EntryWithUrl[];
  profile: Profile | null;
  title?: string;
};

export function DayPageClient({ date, userId, entries, profile, title }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<EntryWithUrl | null>(null);
  const openedFromQueryRef = useRef(false);

  useEffect(() => {
    if (openedFromQueryRef.current) return;
    const entryId = searchParams.get("entry");
    if (!entryId || entries.length === 0) return;
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      openedFromQueryRef.current = true;
      setDetailEntry(entry);
      router.replace(`/?date=${date}`, { scroll: false });
    }
  }, [searchParams, date, entries, router]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {title ?? "음식 리스트"}
          </h2>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="touch-target rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:min-h-0"
          >
            음식 추가
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            이 날짜에 등록된 음식이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 sm:gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-stretch gap-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setDetailEntry(entry)}
                  className="flex min-w-0 flex-1 gap-2 p-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800 sm:p-3"
                >
                  {entry.image_url ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-zinc-900 dark:text-zinc-100">
                      {entry.ai_status === "done" && entry.ai_name?.trim()
                        ? entry.ai_name.trim()
                        : entry.description?.trim() || "(설명 없음)"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                      {entry.ai_category?.trim() && (
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-700">
                          {entry.ai_category.trim()}
                        </span>
                      )}
                      <span>최종 {formatEntryDateTime(entry.updated_at ?? entry.created_at)}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-zinc-400 dark:text-zinc-500">→</span>
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm("이 음식을 삭제할까요?")) return;
                    await deleteFoodEntry(entry.id, date, entry.image_path);
                    router.refresh();
                  }}
                  className="shrink-0 px-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 sm:px-3"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="음식 추가"
      >
        <AddFoodForm
          date={date}
          userId={userId}
          onSuccess={(entry) => {
            setAddModalOpen(false);
            if (entry) setDetailEntry(entry);
            router.refresh();
          }}
        />
      </Modal>

      <Modal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title="음식 상세"
      >
        {detailEntry && (
          <FoodDetailModalContent
            entry={detailEntry}
            date={date}
            profile={profile}
            onClose={() => setDetailEntry(null)}
            onAfterSave={(entry) => {
              if (entry) setDetailEntry(entry);
              router.refresh();
            }}
            onDeleted={() => {
              setDetailEntry(null);
              router.refresh();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function FoodDetailModalContent({
  entry,
  date,
  profile,
  onClose,
  onAfterSave,
  onDeleted,
}: {
  entry: EntryWithUrl;
  date: string;
  profile: Profile | null;
  onClose: () => void;
  onAfterSave?: (entry?: EntryWithUrl) => void;
  onDeleted: () => void;
}) {
  const DAILY = getDailyRecommended(profile);
  const caption =
    profile?.gender && profile?.height_cm != null && profile?.weight_kg != null
      ? `기준: 내 일일 권장량 (성별·키·몸무게 반영) ${DAILY.kcal}kcal, 탄수화물 ${DAILY.carbs_g}g, 단백질 ${DAILY.protein_g}g, 지방 ${DAILY.fat_g}g, 당 ${DAILY.sugar_g}g, 나트륨 ${DAILY.sodium_mg}mg`
      : `기준: 일일 권장 2,000kcal, 탄수화물 300g, 단백질 75g, 지방 65g, 당 50g, 나트륨 2,000mg`;

  return (
    <div className="flex flex-col gap-4">
      {entry.image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.image_url}
            alt="음식 사진"
            className="h-full w-full object-contain"
          />
        </div>
      )}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
          AI 영양 정보
        </h3>
        {entry.ai_status === "pending" || entry.ai_status === "running" ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">분석 중…</p>
        ) : entry.ai_status === "error" ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            AI 오류가 발생했습니다.
          </p>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">음식명</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.ai_name ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">카테고리</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.ai_category?.trim() ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">칼로리</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {typeof entry.ai_kcal === "number"
                    ? `${entry.ai_kcal} kcal (하루 권장량 ${pct(entry.ai_kcal, DAILY.kcal)}%)`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">탄수화물</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {typeof entry.ai_carbs_g === "number"
                    ? `${entry.ai_carbs_g} g (하루 권장량 ${pct(entry.ai_carbs_g, DAILY.carbs_g)}%)`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">단백질</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {typeof entry.ai_protein_g === "number"
                    ? `${entry.ai_protein_g} g (하루 권장량 ${pct(entry.ai_protein_g, DAILY.protein_g)}%)`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">지방</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {typeof entry.ai_fat_g === "number"
                    ? `${entry.ai_fat_g} g (하루 권장량 ${pct(entry.ai_fat_g, DAILY.fat_g)}%)`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">당</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {typeof entry.ai_sugar_g === "number"
                    ? `${entry.ai_sugar_g} g (하루 권장량 ${pct(entry.ai_sugar_g, DAILY.sugar_g)}%)`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-500">나트륨</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {typeof entry.ai_sodium_mg === "number"
                    ? `${entry.ai_sodium_mg} mg (하루 권장량 ${pct(entry.ai_sodium_mg, DAILY.sodium_mg)}%)`
                    : "—"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              {caption}
            </p>
            {entry.ai_comment?.trim() && (
              <div className="mt-3 rounded-md border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  AI 코멘트
                </span>
                <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {entry.ai_comment.trim()}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <FoodDetailForm
        entryId={entry.id}
        date={date}
        initialDescription={entry.description}
        imagePath={entry.image_path}
        onAfterSave={onAfterSave}
        onAfterDelete={onDeleted}
      />
    </div>
  );
}
