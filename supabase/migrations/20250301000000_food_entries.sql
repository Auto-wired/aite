-- food_entries: 해당 날짜에 먹은 음식 (사진·설명, 이후 AI 영양 정보 추가 예정)
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null default '',
  image_path text,
  ai_status text not null default 'pending',
  ai_error text,
  ai_analyzed_at timestamptz,
  ai_name text,
  ai_kcal numeric,
  ai_carbs_g numeric,
  ai_protein_g numeric,
  ai_fat_g numeric,
  ai_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_food_entries_user_date on public.food_entries (user_id, date);
create index if not exists idx_food_entries_user_ai_status on public.food_entries (user_id, ai_status);

alter table public.food_entries enable row level security;

create policy "Users can do everything on own food_entries"
  on public.food_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket (음식 사진)
insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', false)
on conflict (id) do nothing;

-- Storage RLS: 본인 폴더만 업로드/조회/삭제 (경로 첫 번째 폴더 = user_id)
create policy "Users can CRUD own food images"
  on storage.objects for all
  using (bucket_id = 'food-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'food-images' and (storage.foldername(name))[1] = auth.uid()::text);
