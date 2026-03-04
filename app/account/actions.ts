"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  nickname: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(form: {
  nickname?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      nickname: form.nickname ?? null,
      gender: form.gender ?? null,
      height_cm: form.height_cm ?? null,
      weight_kg: form.weight_kg ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };
  revalidatePath("/account");
  revalidatePath("/");
  return { error: null };
}

export async function createProfileAfterSignup(form: {
  nickname?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      nickname: form.nickname ?? null,
      gender: form.gender ?? null,
      height_cm: form.height_cm ?? null,
      weight_kg: form.weight_kg ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/account");
  return { error: null };
}
