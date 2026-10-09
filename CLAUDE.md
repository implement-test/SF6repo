@AGENTS.md

# 프로젝트 메모

- 사양과 확정된 결정사항은 `docs/SPEC.md` 에 있다. 구현 전에 읽고, 결정이 바뀌면 함께 갱신한다.
- 사용자와는 한국어로 대화한다.
- 기능을 추가·수정·삭제하면 `src/content/changelog.ts` 맨 위에 그날 날짜로 한 줄씩 적는다 (ko/en/ja, 관리자 기능은 `adminOnly`).
- 콤보 표기 파서: `src/lib/notation` (테스트 `npm test`). 아이콘 경로는 `icons.ts` 한 곳에서 관리.
- 언어 라우팅은 `proxy.ts` 가 아니라 `next.config.ts` 의 rewrite 로 한다 (Cloudflare 에서 proxy 는 실험 기능).
- 방문자 설정은 `<html data-*>` + CSS 로 전환한다. 페이지를 정적으로 유지하기 위해 서버에서 쿠키/헤더를 읽지 않는다.
- DB 스키마를 바꾸면 `supabase/migrations` 에 새 파일을 추가하고 `src/lib/types.ts` 도 맞춘다.
- `opennextjs-cloudflare build` 는 dev 서버가 켜져 있으면 `.open-next` 잠금으로 실패한다.

# 작업 흐름 (클라우드 세션)

- 이 저장소의 작업은 곧바로 `main` 이 된다. 작업을 마치면 사용자에게 묻지 않고 커밋하고 `main` 에 push 한다 (Workers Builds 가 자동 배포). PR 은 만들지 않는다.
  - 세션 브랜치에서 작업했다면 `git fetch origin main && git rebase origin/main` 후 `git push origin HEAD:main`, 세션 브랜치에도 같이 push 한다.
- push 전에 `npm run lint`, `npm test` 를 통과시킨다. `npm run build` 는 Supabase 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)가 있어야 돈다. 클라우드 세션에서는 Node fetch 가 프록시를 타도록 `NODE_USE_ENV_PROXY=1` 이 필요하다 (훅이 설정).
- 세션 시작 훅(`.claude/hooks/session-start.sh`)이 `.node-version` 의 Node 를 nvm 으로 맞추고 `npm install` 한다. 다른 npm 으로 설치하면 `package-lock.json` 이 바뀌니 커밋에 섞지 않는다.
