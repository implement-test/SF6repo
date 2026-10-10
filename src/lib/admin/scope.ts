/**
 * 관리자 목록(순서 변경 · 비공개 항목 · 카드 옆 순서 변경)이 다루는 표.
 * characterId 가 숫자면 그 캐릭터의 항목, null 이면 공통 공략의 항목 (0028):
 *   - practices / videos 는 character_id 가 비어 있는 행
 *   - common_guides(시스템 글)는 표 전체 (character_id 칸이 없다)
 */
export type ListTable = "combos" | "setups" | "practices" | "vs_guides" | "moves" | "videos" | "common_guides";

/** character_id 칸이 없는 공통 공략 표 */
const COMMON_ONLY = new Set<string>(["common_guides"]);

type Filterable = { eq(column: string, value: number): unknown; is(column: string, value: null): unknown };

/**
 * 조회(Supabase 의 select …)를 이 캐릭터(또는 공통)의 행으로 좁힌다.
 * 빌더 타입을 그대로 돌려준다 (제네릭으로 묶으면 타입 계산이 너무 깊어져서 바꿔 부른다).
 */
export function scoped<Q>(query: Q, table: string, characterId: number | null): Q {
  if (COMMON_ONLY.has(table)) return query;
  const q = query as unknown as Filterable;
  return (characterId === null ? q.is("character_id", null) : q.eq("character_id", characterId)) as Q;
}

/** 편집 권한 범위: 공통(null)은 최고/부 관리자만 (EditScope 의 undefined) */
export const editScope = (characterId: number | null): number | undefined => characterId ?? undefined;
