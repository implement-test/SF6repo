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
  return { classic: typeof s.classic === "string" ? s.classic : "", modern: s.modern ?? null };
}

/** 모든 그룹의 시동기를 순서대로 (검색·미리보기용) */
export function flattenStarters(groups: StarterGroup[]): ComboStarter[] {
  return groups.flatMap((g) => g.starters);
}
