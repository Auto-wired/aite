-- 음식 카테고리 (AI 분석 결과 저장)
alter table public.food_entries
  add column if not exists ai_category text;
