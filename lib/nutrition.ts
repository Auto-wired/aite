/**
 * 성별, 키, 몸무게로 일일 권장량 추정 (Mifflin-St Jeor BMR × 활동계수).
 * 프로필 없으면 기본값 사용.
 */
export type ProfileLike = {
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
} | null;

const DEFAULT_DAILY = {
  kcal: 2000,
  carbs_g: 300,
  protein_g: 75,
  fat_g: 65,
  sugar_g: 50,
  sodium_mg: 2000,
} as const;

export type DailyRecommended = {
  kcal: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  sugar_g: number;
  sodium_mg: number;
};

export function getDailyRecommended(profile: ProfileLike): DailyRecommended {
  const gender = profile?.gender?.trim();
  const height = profile?.height_cm != null ? Number(profile.height_cm) : NaN;
  const weight = profile?.weight_kg != null ? Number(profile.weight_kg) : NaN;
  const hasValid = gender && Number.isFinite(height) && height >= 100 && height <= 250 && Number.isFinite(weight) && weight >= 30 && weight <= 300;
  if (!hasValid) return { ...DEFAULT_DAILY };

  const age = 30;
  const bmr =
    gender === "여성"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = Math.round(bmr * 1.4); // 활동계수 1.4 (가벼운 활동)
  const kcal = Math.max(1200, Math.min(4000, tdee));
  const carbs_g = Math.round((kcal * 0.5) / 4);
  const protein_g = Math.round((kcal * 0.2) / 4);
  const fat_g = Math.round((kcal * 0.3) / 9);
  return {
    kcal,
    carbs_g,
    protein_g,
    fat_g,
    sugar_g: 50,
    sodium_mg: 2000,
  };
}
