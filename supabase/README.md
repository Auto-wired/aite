# Supabase 설정

## 마이그레이션 적용

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택
2. **SQL Editor** 메뉴로 이동
3. `migrations/20250301000000_food_entries.sql` 파일 내용을 복사해 붙여넣고 **Run** 실행

이렇게 하면 `food_entries` 테이블과 `food-images` 스토리지 버킷·정책이 생성됩니다.
