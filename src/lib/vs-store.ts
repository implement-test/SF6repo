"use client";

import { useSyncExternalStore } from "react";
import { rosterBySlug, type RosterGroup } from "./roster";

/**
 * Vs 가이드에서 고른 상대 캐릭터와 분류(초기 로스터 / 시즌 1~4).
 * 분류만 고르면 그 분류의 상대 전체, 캐릭터까지 고르면 그 상대만 본다.
 * 상대 선택 칸(캐릭터 레이아웃, 탭 아래)과 공략 목록(페이지)이 함께 쓴다.
 * 주소의 ?vs=ryu 와 맞춰 두어 링크로 공유할 수 있다 (정적 페이지라 서버는 읽지 않는다).
 * 각 상대의 공략 수는 목록이 알려 준다 (선택 칸에 숫자로 표시).
 */
type State = { group: RosterGroup | null; opponent: string | null; counts: Record<string, number> };

let state: State = { group: null, opponent: null, counts: {} };
let initialized = false;
const listeners = new Set<() => void>();

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const opponent = new URLSearchParams(window.location.search).get("vs");
  state = { ...state, opponent, group: (opponent && rosterBySlug(opponent)?.group) || null };
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** 분류를 바꾸면 고른 캐릭터는 풀린다 */
export function setVsGroup(group: RosterGroup | null) {
  init();
  state = { ...state, group };
  setVsOpponent(null);
}

export function setVsOpponent(slug: string | null) {
  init();
  state = { ...state, opponent: slug, group: (slug && rosterBySlug(slug)?.group) || state.group };
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

export function useVsGroup(): RosterGroup | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      init();
      return state.group;
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
