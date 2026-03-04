-- 당·나트륨 AI 분석 컬럼 추가
alter table public.food_entries
  add column if not exists ai_sugar_g numeric,
  add column if not exists ai_sodium_mg numeric;
