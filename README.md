# Aite

음식 사진을 기록하고 AI로 영양 정보를 분석해 보는 웹 앱입니다.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Storage-3ECF8E?logo=supabase)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-80-2496ED?logo=docker)](https://www.docker.com/)

---

## 사용 기술

| 구분 | 기술 |
|------|------|
| **프레임워크** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI** | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **언어** | [TypeScript](https://www.typescriptlang.org/) |
| **백엔드 / DB / 인증** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) |
| **이미지 처리** | [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) |
| **배포** | Docker, GitHub Actions, GitHub Container Registry (ghcr.io) |

### 기술 스택 요약

- **Next.js** — 풀스택 React 프레임워크, 서버/클라이언트 컴포넌트, 라우팅
- **Supabase** — 회원가입/로그인, 음식·프로필 데이터 저장, 음식 이미지 스토리지
- **Tailwind CSS** — 유틸리티 기반 스타일링
- **TypeScript** — 정적 타입으로 유지보수성 향상
- **Docker** — 동일 환경에서 로컬/서버 실행 및 배포

---

## 로컬에서 실행

### 1. 환경 변수

```bash
cp .env.example .env
# .env 에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 입력
```

Supabase 프로젝트에서 URL과 anon key를 복사해 넣으면 됩니다.

### 2. 개발 서버

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

### 3. Docker Compose (포트 80)

```bash
docker compose up -d
```

[http://localhost](http://localhost) 에서 확인할 수 있습니다.  
이미지 자동 갱신(Watchtower)이 필요하면:

```bash
docker compose --profile watchtower up -d
```

자세한 배포 절차는 **[DEPLOY.md](./DEPLOY.md)** 를 참고하세요.

---

## 프로젝트 구조 (요약)

```
├── app/              # Next.js App Router (페이지, 라우트)
├── components/       # React 컴포넌트
├── lib/              # Supabase 클라이언트, 유틸
├── supabase/         # 마이그레이션 등
├── Dockerfile
├── docker-compose.yml
└── DEPLOY.md         # Docker·GitHub Actions·서버 배포 가이드
```

---

## 라이선스

Private.
