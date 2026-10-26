import type { ComboFinish, ComboRoute, Localized } from "./types";
import { memoToInput, normalizeNotation, splitTopLevel } from "./notation/parse";

/**
 * 마무리로 나누기: 같은 중간 루트를 반복해서 적은 루트들을 "공통 루트 + 마무리 여러 개"로 묶는다.
 *
 *   236hk > 214hk(2) > 623hp            루트  236hk → 214hk(2)
 *   236hk > 214hk(2) > 236236k    →     마무리 623hp / 236236k / 623hp(1) → 236236P
 *   236hk > 214hk(2) > 623hp(1) > 236236P
 *
 * - 마무리가 없는 루트끼리, 공통 앞부분(→ 로 나눈 단계)이 가장 긴 것부터 묶는다. 마무리가 빈 칸이 되는 루트는 빼고 그대로 둔다.
 * - 이미 마무리가 있는 루트는, 그 루트를 앞부분으로 시작하는 다른 루트를 마무리로 더 받는다.
 * - 루트마다 적은 데미지 · 후상황 · 엔더는 해당 마무리로 옮긴다.
 * - 모던 표기도 같은 방식으로 나뉘어야 한다 (아니면 묶지 않고 이유를 알려 준다).
 * - 루트별 메모가 모두 같으면 묶은 루트의 메모로, 다르면 마무리마다의 메모로 옮긴다.
 */

export type SplitGroup = {
  /** 묶인 루트 번호 (0부터) */
  members: number[];
  /** 공통 루트 (클래식) */
  prefix: string;
  /** 마무리 (클래식), 묶인 순서대로 */
  finishes: string[];
};
export type SkippedGroup = { members: number[]; prefix: string; reason: string };
export type SplitResult = { routes: ComboRoute[]; groups: SplitGroup[]; skipped: SkippedGroup[] };

/** → 로 나눈 단계 (대괄호 묶음 안의 → 는 나누지 않는다) */
function steps(notation: string): string[] {
  return splitTopLevel(normalizeNotation(notation.replace(/[{}]/g, " ")), "→")
    .map((s) => s.trim())
    .filter(Boolean);
}
const key = (step: string) => step.replace(/\s+/g, " ").toUpperCase();
/** 저장할 표기: 단계를 → 로 잇고, 표준화로 바뀐 타겟 콤보 · 와 메모 ⟨⟩ 는 입력 표기 .. 와 <> 로 되돌린다 */
const join = (list: string[]) => memoToInput(list.join(" → ").replace(/·/g, ".."));

/** 두 단계 목록의 공통 앞부분 길이 */
function commonLength(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && key(a[n]) === key(b[n])) n++;
  return n;
}

/** 루트를 마무리 하나로: 앞부분 n 단계를 떼고 남은 표기, 루트의 데미지 · 후상황 · 엔더 (메모는 keepNote 일 때) */
function toFinish(
  route: ComboRoute,
  classic: string[],
  modern: string[] | null,
  n: number,
  modernN: number,
  keepNote: boolean,
): ComboFinish {
  return {
    classic: join(classic.slice(n)),
    modern: modern ? join(modern.slice(modernN)) : null,
    damage: route.damage,
    frame_after: route.frame_after,
    ender_id: route.ender_id,
    note: keepNote ? route.note : null,
  };
}

const sameNote = (a: Localized | null, b: Localized | null) => JSON.stringify(a) === JSON.stringify(b);

export function splitRoutes(routes: ComboRoute[]): SplitResult {
  const parsed = routes.map((r) => ({ classic: steps(r.classic), modern: r.modern ? steps(r.modern) : null }));
  const used = new Set<number>();
  const groups: SplitGroup[] = [];
  const skipped: SkippedGroup[] = [];
  /** 결과에서 루트 i 자리에 들어갈 것 (묶인 루트의 첫 번째 자리에 묶음, 나머지는 빠진다) */
  const replaced = new Map<number, ComboRoute>();

  // 1) 이미 마무리가 있는 루트: 이 루트 전체로 시작하는 루트를 마무리로 받는다
  routes.forEach((base, i) => {
    if (base.finishes.length === 0) return;
    const a = parsed[i].classic;
    const takers = routes
      .map((_, j) => j)
      .filter(
        (j) =>
          j !== i &&
          !used.has(j) &&
          routes[j].finishes.length === 0 &&
          parsed[j].classic.length > a.length &&
          commonLength(a, parsed[j].classic) === a.length,
      );
    if (takers.length === 0) return;
    const members = [i, ...takers];
    const baseModern = parsed[i].modern;
    const modernOk = takers.every((j) =>
      baseModern
        ? !!parsed[j].modern && parsed[j].modern!.length > baseModern.length && commonLength(baseModern, parsed[j].modern!) === baseModern.length
        : !parsed[j].modern,
    );
    if (!modernOk) return void skipped.push({ members, prefix: join(a), reason: "모던 표기의 앞부분이 달라 나눌 수 없습니다" });
    // 받는 루트의 메모가 이 루트와 다르면 그 마무리의 메모로
    const added = takers.map((j) =>
      toFinish(routes[j], parsed[j].classic, parsed[j].modern, a.length, baseModern?.length ?? 0, !sameNote(routes[j].note, base.note)),
    );
    replaced.set(i, { ...base, finishes: [...base.finishes, ...added] });
    members.forEach((j) => used.add(j));
    groups.push({ members, prefix: join(a), finishes: [...base.finishes.map((f) => f.classic), ...added.map((f) => f.classic)] });
  });

  // 2) 마무리가 없는 루트끼리: 가장 길게 겹치는 앞부분부터 묶는다 (마무리가 빈 칸이 되면 안 된다)
  const plain = () => routes.map((_, j) => j).filter((j) => !used.has(j) && routes[j].finishes.length === 0);
  const usable = (i: number, j: number) =>
    Math.min(commonLength(parsed[i].classic, parsed[j].classic), parsed[i].classic.length - 1, parsed[j].classic.length - 1);
  const tried = new Set<string>();
  for (;;) {
    const list = plain();
    let best = 0;
    let seed = -1;
    for (const i of list)
      for (const j of list)
        if (i < j && !tried.has(`${i}:${usable(i, j)}`) && usable(i, j) > best) {
          best = usable(i, j);
          seed = i;
        }
    if (best < 1) break;
    tried.add(`${seed}:${best}`);
    const members = [seed, ...list.filter((j) => j !== seed && usable(seed, j) >= best)].sort((x, y) => x - y);
    const prefix = parsed[seed].classic.slice(0, best);

    // 모던: 모두 없거나, 모두 있고 같은 방식으로 나뉘어야 한다
    const moderns = members.map((j) => parsed[j].modern);
    let modernN = 0;
    if (moderns.some(Boolean)) {
      if (!moderns.every(Boolean)) {
        skipped.push({ members, prefix: join(prefix), reason: "모던 표기가 있는 루트와 없는 루트가 섞여 있습니다" });
        continue;
      }
      const m = moderns as string[][];
      modernN = Math.min(...m.slice(1).map((x) => commonLength(m[0], x)), ...m.map((x) => x.length - 1));
      if (modernN < 1) {
        skipped.push({ members, prefix: join(prefix), reason: "모던 표기의 앞부분이 달라 나눌 수 없습니다" });
        continue;
      }
    }
    // 루트별 메모: 모두 같으면 묶은 루트의 메모, 다르면 마무리마다의 메모
    const sharedNote = members.every((j) => sameNote(routes[j].note, routes[seed].note));
    const finishes = members.map((j) => toFinish(routes[j], parsed[j].classic, parsed[j].modern, best, modernN, !sharedNote));
    replaced.set(Math.min(...members), {
      classic: join(prefix),
      modern: moderns[0] ? join(moderns[0].slice(0, modernN)) : null,
      damage: null,
      frame_after: null,
      ender_id: null,
      finishes,
      note: sharedNote ? routes[seed].note : null,
    });
    members.forEach((j) => used.add(j));
    groups.push({ members, prefix: join(prefix), finishes: finishes.map((f) => f.classic) });
  }

  const out: ComboRoute[] = [];
  routes.forEach((r, i) => {
    if (replaced.has(i)) out.push(replaced.get(i)!);
    else if (!used.has(i)) out.push(r);
  });
  return { routes: out, groups, skipped };
}
