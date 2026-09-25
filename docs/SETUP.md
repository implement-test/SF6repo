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
