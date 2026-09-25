"use client";

import { useSyncExternalStore } from "react";
import { TARGET_LEVELS, type TargetLevel } from "@/lib/types";

/**
 * 방문자 설정으로 숨긴 대상 수준 (<html data-hide-*>).
 * 카드 숨김 자체는 CSS 가 하고, 이 값은 건수·관리자 순서 변경처럼 JS 에서 알아야 할 때 쓴다.
 * 서버와 첫 렌더에서는 아무것도 숨기지 않은 것으로 본다.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true });
  return () => observer.disconnect();
}

function snapshot() {
  const html = document.documentElement;
  return TARGET_LEVELS.filter((l) => html.hasAttribute(`data-hide-${l}`)).join(",");
}

export function useHiddenLevels(): (level: TargetLevel) => boolean {
  const hidden = useSyncExternalStore(subscribe, snapshot, () => "");
  const list = hidden ? hidden.split(",") : [];
  return (level) => list.includes(level);
}
