"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFoodEntry, deleteFoodEntry } from "@/app/day/[date]/actions";
import type { FoodEntry } from "@/types/db";

export type EntryWithUrl = FoodEntry & { image_url?: string | null };

type Props = {
  entryId: string;
  date: string;
  initialDescription: string;
  imagePath: string | null;
  onAfterSave?: (entry?: EntryWithUrl) => void;
  onAfterDelete?: () => void;
};

export function FoodDetailForm({
  entryId,
  date,
  initialDescription,
  imagePath,
  onAfterSave,
  onAfterDelete,
}: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const result = await updateFoodEntry(entryId, date, { description });
    setSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "ok", text: "저장되었습니다. AI 분석이 반영되었습니다." });
    onAfterSave?.(result.entry);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("이 음식 기록을 삭제할까요?")) return;
    setMessage(null);
    setDeleting(true);
    const result = await deleteFoodEntry(entryId, date, imagePath);
    setDeleting(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    onAfterDelete?.();
    router.push(`/?date=${date}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            설명
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="뭐 먹었는지"
          />
        </label>
        {message && (
          <p
            className={`text-sm ${
              message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "저장 중…" : "수정 저장"}
        </button>
      </form>

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          이 음식 기록 삭제
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {deleting ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </div>
  );
}
