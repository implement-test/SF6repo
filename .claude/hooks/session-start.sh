#!/bin/bash
# 클라우드 세션 시작 시 의존성을 설치해 lint/test/build 가 바로 돌게 한다.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# .node-version 에 맞춘 Node 를 쓴다 (Workers Builds 와 같은 버전).
# 기본 npm 이 다르면 package-lock.json 이 매번 바뀐다.
NODE_VERSION="$(cat .node-version)"
export NVM_DIR="${NVM_DIR:-/opt/nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u
  . "$NVM_DIR/nvm.sh"
  nvm install "$NODE_VERSION" >/dev/null
  NODE_BIN="$(dirname "$(nvm which "$NODE_VERSION")")"
  set -u
  export PATH="$NODE_BIN:$PATH"
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export PATH=\"$NODE_BIN:\$PATH\"" >> "$CLAUDE_ENV_FILE"
  fi
fi

# Node 내장 fetch 는 HTTPS_PROXY 를 읽지 않아 빌드 중 Supabase 요청이 실패한다
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export NODE_USE_ENV_PROXY=1" >> "$CLAUDE_ENV_FILE"
fi

# 컨테이너 캐시를 활용하려고 npm ci 대신 npm install 을 쓴다
npm install --no-audit --no-fund

# 작업 결과를 main 에 바로 올릴 수 있도록 main 을 최신으로 받아 둔다
git fetch origin main --quiet || true
