"use client";

import { useSyncExternalStore } from "react";

/**
 * 방문자 즐겨찾기. 로그인 없이 이 브라우저의 localStorage 에만 저장한다
 * (서버는 읽지 않는다 — 페이지를 정적으로 유지하기 위해 쿠키를 쓰지 않는다).
 * 종류별 id 목록: { combo: [3, 9], setup: [1] }. 삭제·비공개된 항목의 id 는 목록에 남아도 화면에서 무시된다.
 */
export type FavoriteKind = "combo" | "setup";

const KEY = "sf6r:favorites";
const EVENT = "sf6r:favorites";

type Store = Partial<Record<FavoriteKind, number[]>>;

function read(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" ? (raw as Store) : {};
  } catch {
    return {};
  }
}

export function toggleFavorite(kind: FavoriteKind, id: number) {
  const store = read();
  const list = store[kind] ?? [];
  store[kind] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // 저장소를 쓸 수 없는 브라우저(사생활 보호 모드 등): 조용히 무시
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  // 같은 탭은 직접 보내는 이벤트로, 다른 탭은 storage 이벤트로 따라간다
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 이 종류의 즐겨찾기 id 목록. 서버와 첫 렌더에서는 빈 목록 */
export function useFavorites(kind: FavoriteKind): Set<number> {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (read()[kind] ?? []).join(","),
    () => "",
  );
  return new Set(snapshot ? snapshot.split(",").map(Number) : []);
}
