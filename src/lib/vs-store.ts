"use client";

import { useSyncExternalStore } from "react";

/**
 * Vs 가이드에서 고른 상대 캐릭터.
 * 상대 선택 칸(캐릭터 레이아웃, 필터 바 위)과 공략 목록(페이지)이 함께 쓴다.
 * 주소의 ?vs=ryu 와 맞춰 두어 링크로 공유할 수 있다 (정적 페이지라 서버는 읽지 않는다).
 * 각 상대의 공략 수는 목록이 알려 준다 (선택 칸에 숫자로 표시).
 */
type State = { opponent: string | null; counts: Record<string, number> };

let state: State = { opponent: null, counts: {} };
let initialized = false;
const listeners = new Set<() => void>();

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  state = { ...state, opponent: new URLSearchParams(window.location.search).get("vs") };
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function setVsOpponent(slug: string | null) {
  init();
  state = { ...state, opponent: slug };
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("vs", slug);
  else url.searchParams.delete("vs");
  window.history.replaceState(window.history.state, "", url);
  emit();
}

export function setVsCounts(counts: Record<string, number>) {
  init();
  state = { ...state, counts };
  emit();
}

export function useVsOpponent(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      init();
      return state.opponent;
    },
    () => null,
  );
}

const emptyCounts: Record<string, number> = {};
export function useVsCounts(): Record<string, number> {
  return useSyncExternalStore(
    subscribe,
    () => state.counts,
    () => emptyCounts,
  );
}
