import type { ComboStarter, StarterGroup } from "./types";

/**
 * combos.starters 를 시동기 그룹 목록으로 맞춘다.
 *   예전 형식: [{classic, modern}, ...]          → 이름 없는 그룹 하나
 *   지금 형식: [{name, starters: [...]}, ...]
 */
export function normalizeStarterGroups(raw: unknown): StarterGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const isGroup = (v: unknown) => !!v && typeof v === "object" && Array.isArray((v as StarterGroup).starters);
  if (raw.every(isGroup)) {
    return (raw as StarterGroup[]).map((g) => ({
      name: typeof g.name === "string" && g.name.trim() ? g.name : null,
      starters: g.starters.map(toStarter),
    }));
  }
  return [{ name: null, starters: (raw as unknown[]).filter((v) => !isGroup(v)).map(toStarter) }];
}

function toStarter(v: unknown): ComboStarter {
  const s = (v ?? {}) as Partial<ComboStarter>;
  const out: ComboStarter = { classic: typeof s.classic === "string" ? s.classic : "", modern: s.modern ?? null };
  if (s.damage_basis) out.damage_basis = true;
  return out;
}

/** 모든 그룹의 시동기를 순서대로 (검색·미리보기용) */
export function flattenStarters(groups: StarterGroup[]): ComboStarter[] {
  return groups.flatMap((g) => g.starters);
}

/**
 * 데미지 기준 시동기의 위치 (그룹을 넘어 0부터 센 번호).
 * 고른 것이 없으면 첫 번째(0). 시동기가 없으면 -1.
 */
export function damageBasisIndex(groups: StarterGroup[]): number {
  const all = flattenStarters(groups);
  if (all.length === 0) return -1;
  const chosen = all.findIndex((s) => s.damage_basis);
  return chosen >= 0 ? chosen : 0;
}
