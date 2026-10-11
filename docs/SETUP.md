# 설정 가이드

## 로컬 실행

```bash
npm install
npm run dev
```

Supabase 환경변수가 없으면 `src/lib/data/sample.ts` 의 예시 데이터로 화면이 뜬다.
DB 가 연결돼 있어도 `SF6_SAMPLE_DATA=1` 로 실행하면 예시 데이터로 확인할 수 있다.

DB 스키마가 바뀌면 `supabase/migrations` 에 번호순으로 파일이 추가된다. 아직 실행하지 않은 파일만 SQL Editor 에서 차례로 실행한다.

```bash
npm test        # 표기법 파서 테스트
npm run lint
```

## 1. Supabase

1. https://supabase.com 에서 새 프로젝트 생성 (Region: Northeast Asia (Seoul))
2. SQL Editor 에서 차례로 실행
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_seed.sql`
   - `supabase/migrations/0003_combo_starters.sql`
   - `supabase/migrations/0004_admin_roles.sql`
   - `supabase/migrations/0005_starter_presets.sql`
   - `supabase/migrations/0006_combo_tags.sql`
   - `supabase/migrations/0007_setups.sql`
   - `supabase/migrations/0008_setup_situations.sql`
   - `supabase/migrations/0009_drop_combo_end_position.sql`
   - `supabase/migrations/0010_youtube_loop.sql`
   - `supabase/migrations/0011_reorder_quiet.sql`
   - `supabase/migrations/0012_combo_routes.sql`
   - `supabase/migrations/0013_route_notes.sql`
   - `supabase/migrations/0014_vs_guides.sql`
   - `supabase/migrations/0015_all_characters.sql`
   - `supabase/migrations/0016_overview_moves.sql`
   - `supabase/migrations/0017_vs_actions.sql`
   - `supabase/migrations/0018_vs_topics.sql`
   - `supabase/migrations/0019_patch_review_quiet.sql`
   - `supabase/migrations/0020_videos.sql`
   - `supabase/migrations/0021_combo_rework.sql`
   - `supabase/migrations/0022_practices.sql`
   - `supabase/migrations/0023_user_favorites.sql`
   - `supabase/migrations/0024_setup_route_links.sql`
   - `supabase/migrations/0025_combo_enders.sql`
   - `supabase/migrations/0026_character_publish_super.sql`
   - `supabase/migrations/0027_vs_patterns.sql`
3. Authentication → Sign In / Providers → **Allow new users to sign up 끄기**
4. Authentication → Users → Add user 로 최고 관리자 계정(이메일+비밀번호) 생성 (Auto Confirm User 체크)
5. SQL Editor 에서 최고 관리자 등록 (처음 한 번만)
   ```sql
   insert into admins (user_id, role) select id, 'super' from auth.users where email = '관리자 이메일';
   ```
   0004 이전에 등록한 관리자는 0004 를 실행할 때 자동으로 최고 관리자가 된다.
6. Project Settings → API 에서 `Project URL`, `anon public` 키 확인 → `.env.local` 에 입력 (`.env.example` 참고)

### 관리자 추가 (부 관리자 / 캐릭터 관리자)

1. Supabase 대시보드 → Authentication → Users → **Add user** → **Create new user**
   - 이메일, 임시 비밀번호 입력, **Auto Confirm User** 체크
2. 사이트 `/admin` → 관리자 → **+ 관리자 추가** → 이메일로 찾아 역할·표시 이름·담당 캐릭터 지정
3. 새 관리자에게 이메일과 임시 비밀번호를 전달한다. 비밀번호 변경은 대시보드에서 한다
   (Users → 해당 계정 → Reset password 또는 직접 변경).
4. 해임은 `/admin` 에서 한다. 로그인 계정 자체를 없애려면 대시보드에서 사용자를 삭제한다.

## 2. GitHub

1. GitHub 에 새 저장소 생성 (예: `sf6-repository`)
2. 로컬 저장소 연결 후 push

## 3. Cloudflare

사이트 주소: https://sf6.nogamenogain.com (`wrangler.jsonc` 의 routes, custom_domain). workers.dev 주소는 보안 설정 우회를 막으려고 꺼 두었다 (`workers_dev: false`)

### 처음 한 번
1. `npx wrangler login` (PowerShell 에서는 `npx.cmd`)
2. R2 버킷: `npx wrangler r2 bucket create sf6-repository-opennext-cache` (ISR 캐시)
   - **수명 주기 규칙(필수)**: R2 → `sf6-repository-opennext-cache` → Settings → Object lifecycle rules → Add rule
     - 이름 예: `old-builds`, Prefix: `incremental-cache/`, Action: **Delete objects**, **3일** 뒤
     - 캐시는 `incremental-cache/{빌드 ID}/…` 에 저장되어 배포할 때마다 새 폴더가 생기고 예전 것은 지워지지 않는다. 이 규칙이 없으면 배포할수록 용량이 계속 늘어난다
     - 지금 빌드의 캐시도 3일이 지나면 지워지지만, 다음 방문 때 다시 만들어진다 (페이지당 한 번)
   - 영상(움짤)은 별도 버킷 `sf6-media` (공개 접근 허용)
3. D1(태그 캐시): `npx wrangler d1 create sf6-repository-tag-cache` → 나온 database_id 를 `wrangler.jsonc` 의 `d1_databases` 에 넣는다
   - 없으면 관리자가 저장해도(revalidatePath) 배포된 사이트에 반영되지 않는다. 표(`revalidations`)는 배포할 때 자동으로 만들어진다

### 배포
`main` 에 push 하면 자동 배포된다 (Workers Builds, 저장소 implement-test/SF6repo).
- 대시보드: Workers → sf6-repository → Settings → Build
  - Build command `npx opennextjs-cloudflare build`, Deploy command `npx opennextjs-cloudflare deploy`
  - Build variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (빌드에 들어가야 하므로 Runtime 변수가 아니라 Build 변수)
  - Node 버전은 `.node-version` (24)
- 빌드 로그: Workers → sf6-repository → Deployments

수동 배포가 필요하면 로컬에서:
```bash
npm run deploy
```
(dev 서버가 켜져 있으면 `.open-next` 잠금으로 빌드가 실패하니 먼저 끈다. 환경변수는 `.env.local` 값이 들어간다)

### 설정 메모
- 언어 rewrite(`next.config.ts`)는 첫 단계/나머지 단계를 나눠 받는다. 여러 단계를 한 칸에 담으면 OpenNext 라우터에서 500 오류
- `open-next.config.ts`: R2 증분 캐시 + 앞단 regional cache(데이터센터별 Cache API, 하루 보관, 적중 때 R2 를 다시 읽지 않음) + D1 태그 캐시 + 메모리 큐(자기 참조 서비스 바인딩)
- 페이지는 `revalidate = false`: 시간이 지나도 다시 만들지 않고, 관리자가 저장할 때만 `/api/revalidate` 로 그 캐릭터(또는 공통 공략) 페이지를 갱신한다
- Worker 진입점은 `worker.mjs`: OpenNext 워커에 Cron(`wrangler.jsonc` 의 `triggers`, 하루 한 번 UTC 18:17)을 덧붙여 `/api/ping` 으로 Supabase 를 깨운다 (무료 프로젝트 7일 일시정지 방지). Cron 실행 기록은 Workers → sf6-repository → Settings → Triggers
- AI 크롤러: `public/robots.txt` 로 거부를 알리고, 실제 차단은 Cloudflare → Security → Bots 의 Block AI bots
