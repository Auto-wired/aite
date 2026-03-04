type MacroResult = {
  name: string | null;
  category: string | null;
  kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  notes?: string | null;
  comment?: string | null;
};

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type ProfileLike = {
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
} | null;

export async function analyzeFoodWithGemini(input: {
  description: string;
  image?: { mimeType: string; base64: string } | null;
  profile?: ProfileLike;
}): Promise<{ parsed: MacroResult; rawText: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const prompt = [
    "너는 영양 분석 도우미야.",
    "사용자가 올린 음식 사진(있다면)과 설명을 바탕으로, 가능한 한 현실적인 1인분 기준 추정치를 계산해.",
    "반드시 아래 JSON만 출력해. (추가 텍스트 금지)",
    "",
    "{",
    '  "name": string | null,',
    '  "category": string | null,',
    '  "kcal": number | null,',
    '  "carbs_g": number | null,',
    '  "protein_g": number | null,',
    '  "fat_g": number | null,',
    '  "sugar_g": number | null,',
    '  "sodium_mg": number | null,',
    '  "notes": string | null,',
    '  "comment": string | null',
    "}",
    "",
    "comment: 이 식단에 대한 한두 문장 짧은 평가·조언을 한국어로 작성 (예: 영양 균형이 좋음, 단백질 보강 권장 등). 사용자 프로필이 주어지면 성별·키·몸무게를 반영한 맞춤 조언을 해줘. 없으면 null.",
    "",
    "category: 음식 카테고리 하나만 한국어로 (예: 밥류, 면류, 국·찌개, 반찬, 고기·구이, 샐러드·채소, 빵·과자, 간식, 음료, 기타). 없으면 null.",
    "",
    "규칙:",
    "- 값은 대략 추정치여도 괜찮지만, 불확실하면 null로.",
    "- 단위: kcal, g. sodium_mg는 나트륨(mg).",
    "",
    input.profile?.gender && input.profile?.height_cm != null && input.profile?.weight_kg != null
      ? `사용자 프로필: 성별 ${input.profile.gender}, 키 ${input.profile.height_cm}cm, 몸무게 ${input.profile.weight_kg}kg.`
      : "",
    "",
    `사용자 설명: ${input.description || "(없음)"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const parts: any[] = [{ text: prompt }];
  if (input.image?.base64) {
    parts.unshift({
      inlineData: { mimeType: input.image.mimeType, data: input.image.base64 },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90초 타임아웃
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API 오류 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as any;
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    JSON.stringify(data?.candidates?.[0]?.content ?? data);

  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    // responseMimeType가 무시되거나 모델이 규칙을 어겼을 때
    parsedJson = null;
  }

  const parsed: MacroResult = {
    name: typeof parsedJson?.name === "string" ? parsedJson.name : null,
    category: typeof parsedJson?.category === "string" ? parsedJson.category : null,
    kcal: coerceNumber(parsedJson?.kcal),
    carbs_g: coerceNumber(parsedJson?.carbs_g),
    protein_g: coerceNumber(parsedJson?.protein_g),
    fat_g: coerceNumber(parsedJson?.fat_g),
    sugar_g: coerceNumber(parsedJson?.sugar_g),
    sodium_mg: coerceNumber(parsedJson?.sodium_mg),
    notes: typeof parsedJson?.notes === "string" ? parsedJson.notes : null,
    comment: typeof parsedJson?.comment === "string" ? parsedJson.comment : null,
  };

  return { parsed, rawText };
}

