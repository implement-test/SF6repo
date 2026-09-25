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
3. Authentication → Sign In / Providers → **Allow new users to sign up 끄기**
4. Authentication → Users → Add user 로 관리자 계정(이메일+비밀번호) 생성
5. SQL Editor 에서 관리자 등록
   ```sql
   insert into admins (user_id) select id from auth.users where email = '관리자 이메일';
   ```
6. Project Settings → API 에서 `Project URL`, `anon public` 키 확인 → `.env.local` 에 입력 (`.env.example` 참고)

## 2. GitHub

1. GitHub 에 새 저장소 생성 (예: `sf6-repository`)
2. 로컬 저장소 연결 후 push

## 3. Cloudflare

OpenNext 는 Windows 에서 빌드가 불안정하므로, 빌드는 Cloudflare 서버(Workers Builds)에서 한다.

1. R2 → 버킷 2개 생성
   - `sf6-repository-opennext-cache` (ISR 캐시)
   - `sf6-repository-media` (영상, 공개 접근 허용)
2. Workers & Pages → Create → Import a repository → GitHub 저장소 선택
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
3. 환경변수(Build variables 와 Variables 둘 다): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 배포 후 `sf6-repository.<계정>.workers.dev` 로 접속 확인
5. 도메인 구입 후 Workers → Settings → Domains 에서 `sf6repository.com` 연결
