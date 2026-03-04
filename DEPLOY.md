# Docker 배포 가이드 (개인 서버 + Watchtower)

이 문서는 **보안 설정**과 **Git push → 자동 빌드 → 개인 서버 자동 배포**까지 한 번에 설정하는 방법을 설명합니다.

---

## 1. 보안: 절대 Git에 넣으면 안 되는 것

다음 파일/폴더는 **절대 커밋하면 안 됩니다**. 이미 `.gitignore`에 포함되어 있습니다.

| 대상 | 설명 |
|------|------|
| `.env`, `.env.local`, `.env.production` 등 | Supabase URL/키, API 키 등 비밀값 |
| `*.pem` | SSL/SSH 키 등 |
| `secrets.*` | 비밀 설정 파일 |

- **로컬/서버**: 환경 변수는 각자 `.env` 파일로 관리하고, 이 파일은 **Git에 올리지 않습니다**.
- **확인**: `git status` 했을 때 `.env` 또는 `.env.local`이 보이면 안 됩니다. 보이면 `git check-ignore -v .env` 로 무시되는지 확인하세요.

---

## 2. 전체 흐름 (Git push → 서버 반영)

```
[내 PC] git push origin main
    ↓
[GitHub] main 브랜치에 push 감지
    ↓
[GitHub Actions] Docker 이미지 빌드 → ghcr.io에 push
    ↓
[내 서버] Watchtower가 주기적으로 ghcr.io 이미지 확인
    ↓
[Watchtower] 새 이미지 있으면 pull → 기존 컨테이너 교체 재시작
```

**즉, `main`에 push만 하면 빌드까지는 자동이고, 서버에서는 Watchtower 한 번 설정해 두면 이후에는 자동으로 새 이미지를 받아서 재시작합니다.**

---

## 3. 해야 할 설정 요약

| 단계 | 어디서 | 할 일 |
|------|--------|--------|
| 3-1 | GitHub | **Secrets**에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록 (빌드 시 사용) |
| 3-2 | GitHub | 저장소가 private이면 패키지(ghcr.io) 읽기용 토큰 준비 |
| 3-3 | 서버 | Docker 설치, 프로젝트용 `.env` 파일 생성 (선택, 서버 전용 추가 변수용) |
| 3-4 | 서버 | 최초 1회: ghcr.io 로그인 + 컨테이너 실행 |
| 3-5 | 서버 | Watchtower 설치·실행 (같은 서버에서 이미지 감시) |

---

## 4. GitHub 쪽 설정

### 4-1. 자동 빌드 (이미 있음)

- `main`에 push하면 `.github/workflows/deploy.yml`이 실행되어 이미지를 빌드하고 **ghcr.io**에 push합니다.
- 별도 설정 없이 **GITHUB_TOKEN**으로 push 가능합니다.

### 4-2. Supabase 환경 변수 (필수)

Next.js는 **`NEXT_PUBLIC_*` 환경 변수를 빌드 시점에** JavaScript 번들에 넣습니다.  
실행 시 `docker run --env-file .env`로 넘겨도 이미 빌드된 코드는 바뀌지 않으므로, **반드시 이미지를 빌드할 때** 이 값들이 들어가야 합니다.

GitHub Actions에서 이미지를 빌드하므로, **저장소 Secrets**에 다음 두 개를 등록해 두세요.

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 로 아래 두 개 추가:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (예: `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

이렇게 해 두면 워크플로에서 Docker 빌드 시 `--build-arg`로 넘기고, 이미지 안에 Supabase 설정이 포함됩니다.  
**이 값들을 추가한 뒤에는 한 번 다시 push하거나 "Run workflow"로 빌드를 다시 돌려야** 새 이미지에 반영됩니다.

로컬에서 직접 `docker build` 할 때는:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t aite .
```

### 4-3. 이미지가 private인 경우 (저장소가 private이면 보통 private)

서버에서 이 이미지를 pull하려면 **Personal Access Token (PAT)** 이 필요합니다.

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**  
2. **Generate new token (classic)**  
3. 권한: `read:packages` (패키지 읽기) 체크  
4. 생성된 토큰을 **한 번만** 복사해 두고, 서버에서만 사용합니다. (채팅/이메일에 붙여넣지 마세요.)

---

## 5. 서버 초기 설정 (한 번만)

### 5-1. Docker 설치

(이미 있으면 생략)

```bash
# Ubuntu/Debian 예시
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a644 /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
# 로그아웃 후 다시 로그인
```

### 5-2. 환경 변수 파일 만들기 (Git 사용 금지)

서버의 **한 디렉터리**에서만 관리하고, 그 경로는 Git과 무관하게 둡니다.

```bash
mkdir -p ~/aite-app
cd ~/aite-app
nano .env
```

`.env` 내용 예시:

```env
# Supabase (이미지는 빌드 시 GitHub Secrets로 들어가므로 서버 .env 는 선택)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Gemini AI 음식 분석 (서버에서만 읽음 → 반드시 여기 .env 에 넣기)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
```

- **NEXT_PUBLIC_*** : Docker 이미지는 GitHub Actions 빌드 시 이미 포함되므로, 서버 `.env`에 다시 넣지 않아도 됩니다. (넣어도 무방)
- **GEMINI_API_KEY**, **GEMINI_MODEL** : 빌드에 포함되지 않고 **실행 시** 읽기 때문에, 서버 `.env`에 꼭 넣어야 AI 음식 분석이 동작합니다.

저장 후 권한 제한:

```bash
chmod 600 .env
```

**이 디렉터리에는 Git을 초기화하지 않고, `.env`는 절대 다른 곳으로 복사하거나 공유하지 마세요.**

### 5-3. ghcr.io 로그인 (이미지가 private일 때)

위에서 만든 **PAT**를 사용합니다. 서버에서만 실행하세요.

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

- `YOUR_GITHUB_PAT`: 4-2에서 만든 토큰  
- `YOUR_GITHUB_USERNAME`: GitHub 아이디  

이미지가 **public**이면 로그인 없이 `docker pull`만 해도 됩니다.

### 5-4. 이미지 이름 확인

저장소가 **`myuser/aite`** 이면 이미지 이름은:

- `ghcr.io/myuser/aite:latest`

입니다. 아래 모든 예시에서 `myuser`를 본인 username(또는 org 이름)으로 바꾸세요.

### 5-5. 최초 1회 컨테이너 실행 (Docker Compose 권장)

**방법 A: Docker Compose 사용 (권장)**

서버에 프로젝트를 clone 하거나 `docker-compose.yml`과 `.env`만 둔 디렉터리에서:

```bash
cd ~/aite-app
# ghcr.io 이미지로 실행하려면 docker-compose.override.yml 에 image 지정 (아래 참고)
docker compose up -d
```

이미지를 빌드하지 않고 **ghcr.io에서 받아서** 쓰려면, 같은 폴더에 `docker-compose.override.yml`을 만들고:

```yaml
services:
  app:
    image: ghcr.io/YOUR_GITHUB_USERNAME/aite:latest
    build: {}
```

그다음 `docker compose up -d` 하면 기존 `build` 대신 해당 이미지를 사용합니다.

Watchtower까지 함께 쓰려면:

```bash
# .env.watchtower 에 DOCKER_USER, DOCKER_PASSWORD( PAT ) 설정 후
docker compose --profile watchtower up -d
```

**방법 B: docker run 만 사용**

```bash
cd ~/aite-app
docker pull ghcr.io/YOUR_GITHUB_USERNAME/aite:latest
docker run -d \
  --name aite \
  -p 80:80 \
  --env-file .env \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/aite:latest
```

- `~/aite-app/.env`를 사용합니다. (다른 경로면 `--env-file /경로/.env` 로 변경)
- `--restart unless-stopped`: 서버 재부팅 시 컨테이너도 자동 시작

동작 확인:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost
# 200 나오면 정상
```

---

## 6. Watchtower 설정 (자동 갱신)

Watchtower는 **같은 서버**에서 돌면서, 지정한 이미지에 새 버전이 있으면 pull 후 해당 컨테이너를 새 이미지로 교체·재시작합니다.

### 6-1. Watchtower 한 번 실행

ghcr.io를 쓰므로 **인증 정보**를 전달해 줘야 합니다. 보통 **같은 서버의 Docker 소켓**과 **env로 로그인 정보**를 넘깁니다.

**방법 A: env 파일로 로그인 정보 넘기기 (권장)**

```bash
cd ~/aite-app
nano .env.watchtower
```

내용 (한 줄씩, 값만 넣기):

```env
DOCKER_USER=YOUR_GITHUB_USERNAME
DOCKER_PASSWORD=YOUR_GITHUB_PAT
```

저장 후:

```bash
chmod 600 .env.watchtower
```

Watchtower 실행:

```bash
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --env-file /home/YOUR_USER/aite-app/.env.watchtower \
  containrrr/watchtower \
  --interval 300 \
  aite
```

- `--interval 300`: 300초(5분)마다 이미지 확인  
- `aite`: **컨테이너 이름**이 `aite`인 것만 갱신 (다른 컨테이너는 건드리지 않음)

경로는 실제 홈 경로로 바꾸세요 (예: `/home/ubuntu/aite-app/.env.watchtower`).

**방법 B: 로그인을 미리 해 두고 Watchtower는 단순 실행**

이미 `docker login ghcr.io` 해 두었다면, Watchtower만 돌려도 같은 Docker가 사용하므로 pull 가능합니다. 단, 로그인 정보가 **root 쪽 Docker config**에 있어야 합니다.

```bash
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /root/.docker/config.json:/config.json \
  -e DOCKER_CONFIG=/config.json \
  containrrr/watchtower \
  --interval 300 \
  aite
```

(실제 Docker config 경로는 환경에 맞게 수정)

### 6-2. 동작 확인

- `main`에 push → 몇 분 내 Actions 빌드 완료  
- 5분(또는 설정한 interval) 이내에 Watchtower가 `ghcr.io/.../aite:latest`를 pull 하고 `aite` 컨테이너를 새 이미지로 재생성합니다.

로그 확인:

```bash
docker logs watchtower
```

---

## 7. 정리: Git push 후 자동으로 되는 것 / 직접 해야 하는 것

| 자동 (Git push만 하면 됨) | 수동 (한 번만 또는 서버에서만) |
|---------------------------|--------------------------------|
| GitHub Actions로 이미지 빌드 | 서버에 Docker 설치 |
| ghcr.io에 이미지 push | 서버에 `.env` 파일 생성 (Git 없이) |
| Watchtower가 새 이미지로 컨테이너 교체 | 최초 1회: `docker run` 으로 `aite` 실행 |
| | 최초 1회: Watchtower 컨테이너 실행 |

**즉, “깃 커밋( push )하면 자동으로 되는 것”은 “이미지가 빌드되어 ghcr.io에 올라가는 것”까지입니다.**  
서버에서 “그 이미지를 받아서 실행하고, Watchtower로 자동 갱신”하는 부분은 위 5·6절처럼 **한 번 설정**해 두면, 이후에는 push만 해도 Watchtower가 새 이미지를 받아서 자동으로 재시작합니다.

---

## 8. 로컬에서만 이미지 실행해 보기

배포 전에 로컬에서 포트 80으로 확인하려면:

```bash
docker build -t aite .
docker run -p 80:80 --env-file .env.local aite
```

`.env.local`은 Git에 넣지 말고, 로컬에만 두세요.
