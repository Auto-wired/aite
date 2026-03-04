"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/app/account/actions";
import { analyzeFoodWithGemini } from "@/lib/ai/gemini";

const BUCKET = "food-images";

async function fetchImageAsBase64FromSignedUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 다운로드 실패 (${res.status})`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuf = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString("base64");
  return { mimeType: contentType, base64 };
}

export async function analyzeFoodEntry(entryId: string, date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: entry, error: getError } = await supabase
    .from("food_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();
  if (getError || !entry) return { error: getError?.message ?? "데이터를 찾을 수 없습니다." };

  const { error: markErr } = await supabase
    .from("food_entries")
    .update({ ai_status: "running", ai_error: null })
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (markErr) return { error: markErr.message };

  try {
    let image: { mimeType: string; base64: string } | null = null;
    if (entry.image_path) {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(entry.image_path, 60);
      if (data?.signedUrl) {
        image = await fetchImageAsBase64FromSignedUrl(data.signedUrl);
      }
    }

    const profile = await getProfile(user.id);
    const { parsed, rawText } = await analyzeFoodWithGemini({
      description: entry.description ?? "",
      image,
      profile,
    });

    const { error: updErr } = await supabase
      .from("food_entries")
      .update({
        ai_status: "done",
        ai_error: null,
        ai_analyzed_at: new Date().toISOString(),
        ai_name: parsed.name,
        ai_category: parsed.category ?? null,
        ai_kcal: parsed.kcal,
        ai_carbs_g: parsed.carbs_g,
        ai_protein_g: parsed.protein_g,
        ai_fat_g: parsed.fat_g,
        ai_sugar_g: parsed.sugar_g ?? null,
        ai_sodium_mg: parsed.sodium_mg ?? null,
        ai_comment: parsed.comment ?? null,
        ai_raw: { rawText, parsed },
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", user.id);
    if (updErr) {
      await supabase
        .from("food_entries")
        .update({
          ai_status: "error",
          ai_error: updErr.message,
          ai_analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId)
        .eq("user_id", user.id);
      return { error: updErr.message };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI 분석 중 오류";
    await supabase
      .from("food_entries")
      .update({
        ai_status: "error",
        ai_error: msg,
        ai_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", user.id);
    return { error: msg };
  }

  revalidatePath("/");
  return { error: null };
}

export async function createFoodEntry(
  date: string,
  description: string,
  imagePath: string | null,
  entryId: string
): Promise<{ error: string | null; entry?: Awaited<ReturnType<typeof getFoodEntryForModal>> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  if (!imagePath?.trim()) return { error: "음식 사진을 선택해 주세요." };
  if (!description?.trim()) return { error: "음식 설명을 입력해 주세요." };

  const { error } = await supabase.from("food_entries").insert({
    id: entryId,
    user_id: user.id,
    date,
    description: description.trim() || " ",
    image_path: imagePath,
    ai_status: "pending",
  });
  if (error) return { error: error.message };

  // AI 분석이 끝난 뒤에 응답 (최종 저장 완료)
  const analysisResult = await analyzeFoodEntry(entryId, date);

  revalidatePath("/");

  const entry = await getFoodEntryForModal(supabase, entryId, user.id);
  return {
    error: analysisResult.error ?? null,
    entry: entry ?? undefined,
  };
}

async function getFoodEntryForModal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryId: string,
  userId: string
) {
  const { data: row } = await supabase
    .from("food_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .single();
  if (!row) return null;
  let image_url: string | null = null;
  if (row.image_path) {
    image_url = await getFoodImageUrl(row.image_path);
  }
  return { ...row, image_url };
}

export async function updateFoodEntry(
  id: string,
  date: string,
  data: { description?: string; image_path?: string | null }
): Promise<{ error: string | null; entry?: Awaited<ReturnType<typeof getFoodEntryForModal>> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("food_entries")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  // 수정 반영 후 AI 재분석
  const analysisResult = await analyzeFoodEntry(id, date);

  revalidatePath("/");

  const entry = await getFoodEntryForModal(supabase, id, user.id);
  return {
    error: analysisResult.error ?? null,
    entry: entry ?? undefined,
  };
}

export async function deleteFoodEntry(id: string, date: string, imagePath: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  if (imagePath) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
  }
  const { error } = await supabase
    .from("food_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { error: null };
}

export async function getFoodImageUrl(imagePath: string) {
  const supabase = await createClient();
  const {
    data: { signedUrl },
  } = await supabase.storage.from(BUCKET).createSignedUrl(imagePath, 3600);
  return signedUrl;
}
