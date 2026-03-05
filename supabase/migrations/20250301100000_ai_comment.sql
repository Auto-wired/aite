-- AI 코멘트(음식 평가) 컬럼 추가
alter table public.food_entries
  add column if not exists ai_comment text;
