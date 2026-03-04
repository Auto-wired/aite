"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { createFoodEntry } from "@/app/day/[date]/actions";
import type { FoodEntry } from "@/types/db";

export type EntryWithUrl = FoodEntry & { image_url?: string | null };

const BUCKET = "food-images";

const COMPRESS_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.9,
  preserveExif: false,
};

type Props = {
  date: string;
  userId: string;
  onSuccess?: (entry?: EntryWithUrl) => void;
};

export function AddFoodForm({ date, userId, onSuccess }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const item = e.dataTransfer.files?.[0];
    if (item?.type.startsWith("image/")) setFile(item);
  }

  function handleZoneClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    if (chosen?.type.startsWith("image/")) setFile(chosen);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!file) {
      setError("음식 사진을 선택해 주세요.");
      return;
    }
    if (!description.trim()) {
      setError("음식 설명을 입력해 주세요.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const entryId = crypto.randomUUID();

    try {
      const compressed = await imageCompression(file, COMPRESS_OPTIONS);
      const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase().replace(/jpeg/, "jpg") || "jpg";
      const path = `${userId}/${entryId}/image.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      const result = await createFoodEntry(date, description.trim(), path, entryId);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setDescription("");
      setFile(null);
      onSuccess?.(result.entry);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">음식 추가</h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {info && (
        <p className="text-sm text-green-700 dark:text-green-400">{info}</p>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">사진 (필수)</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden
        />
        <button
          type="button"
          onClick={handleZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:min-h-[140px] ${
            isDragging
              ? "border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800"
              : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          }`}
        >
          {previewUrl ? (
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 sm:max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="선택한 음식 사진" className="aspect-video w-full object-contain" />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                클릭하면 다시 선택
              </p>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                사진을 여기에 드래그하거나 클릭
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                모바일: 사진 보관함 또는 촬영
              </span>
            </>
          )}
        </button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">설명 (필수)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="뭐 먹었는지 적어주세요"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="touch-target rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:min-h-0 sm:py-2"
      >
        {loading ? "저장 및 AI 분석 중…" : "추가"}
      </button>
    </form>
  );
}
