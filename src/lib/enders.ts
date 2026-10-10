import { bracketBody, normalizeNotation, splitTopLevel } from "./notation/parse";
import { comboRoutes } from "./combo-routes";
import type { Combo, ComboEnder, ComboRoute } from "./types";

/**
 * 엔더(콤보를 끝낸 기술) 맞추기.
 * 루트(마무리가 있으면 마무리 하나하나)의 마지막 기술과 엔더 표기를 비교해 자동으로 찾고,
 * 루트 · 마무리에 ender_id 가 있으면 그 엔더를 쓴다. 후상황은 루트 · 마무리에 적은 값, 없으면 엔더의 값.
 */

/**
 * 표기의 마지막 기술 (비교용: 표준 기호 · 대문자, 생략 표시 { } 는 뺀다. 마지막 단계가 '이 중 하나(::)'면 첫 번째 선택지).
 * 대괄호 묶음([A :: B → C])으로 끝나면 첫 번째 선택지의 마지막 기술.
 * etc 로 끝나면 콤보가 열려 있으므로 끝낸 기술이 없다 ("").
 */
export function lastStepKey(notation: string): string {
  const lastOf = (src: string) => splitTopLevel(src, "→").at(-1)?.trim() ?? "";
  let last = lastOf(normalizeNotation(notation.replace(/[{}]/g, " ")));
  for (let body = bracketBody(last); body !== null; body = bracketBody(last)) {
    last = lastOf(splitTopLevel(body, "::")[0]);
  }
  // 데미지(=1040, 숫자만 든 메모 (1040))는 기술이 아니므로 뗀다
  const key = last
    .split("::")[0]
    .replace(/\s*(?:=\d[\d~-]*|\(\d{3,5}(?:[~-]\d{3,5})?\))\s*$/, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  return /^ETC\.?$/.test(key) ? "" : key;
}

/** 직접 고른 엔더, 없으면 마지막 기술이 같은 첫 엔더 (enders 는 sort_order 순) */
export function resolveEnder(classic: string, enderId: number | null, enders: ComboEnder[]): ComboEnder | null {
  if (enderId !== null) {
    const chosen = enders.find((e) => e.id === enderId);
    if (chosen) return chosen;
  }
  const key = lastStepKey(classic);
  if (!key) return null;
  return enders.find((e) => lastStepKey(e.notation_classic) === key) ?? null;
}

/** 콤보가 끝나는 지점 하나: 마무리가 없는 루트, 또는 루트의 마무리 하나 */
export type ComboEnd = {
  routeIndex: number;
  finishIndex: number | null;
  ender: ComboEnder | null;
  /** 루트 · 마무리에 적은 후상황, 없으면 엔더의 후상황 */
  frameAfter: string | null;
};

export function routeEnds(routes: ComboRoute[], enders: ComboEnder[]): ComboEnd[] {
  return routes.flatMap((route, routeIndex): ComboEnd[] => {
    if (route.finishes.length === 0) {
      const ender = resolveEnder(route.classic, route.ender_id, enders);
      return [{ routeIndex, finishIndex: null, ender, frameAfter: route.frame_after ?? ender?.frame_after ?? null }];
    }
    return route.finishes.map((finish, finishIndex) => {
      const ender = resolveEnder(finish.classic, finish.ender_id, enders);
      return { routeIndex, finishIndex, ender, frameAfter: finish.frame_after ?? ender?.frame_after ?? null };
    });
  });
}

export function comboEnds(combo: Combo, enders: ComboEnder[]): ComboEnd[] {
  return routeEnds(comboRoutes(combo), enders);
}

/** 이 콤보가 쓰는 엔더 id (필터용) */
export function comboEnderIds(combo: Combo, enders: ComboEnder[]): number[] {
  return [...new Set(comboEnds(combo, enders).flatMap((e) => (e.ender ? [e.ender.id] : [])))];
}

/** 화면에 보일 루트: 후상황을 비워 둔 루트 · 마무리는 엔더의 후상황으로 채운다 */
export function withEnderFrames(routes: ComboRoute[], enders: ComboEnder[]): ComboRoute[] {
  if (enders.length === 0) return routes;
  return routes.map((route) => ({
    ...route,
    frame_after:
      route.finishes.length === 0
        ? (route.frame_after ?? resolveEnder(route.classic, route.ender_id, enders)?.frame_after ?? null)
        : route.frame_after,
    finishes: route.finishes.map((f) => ({
      ...f,
      frame_after: f.frame_after ?? resolveEnder(f.classic, f.ender_id, enders)?.frame_after ?? null,
    })),
  }));
}
