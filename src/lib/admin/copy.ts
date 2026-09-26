import { ENTITIES, today, type EntityType } from "./entities";
import type { Localized } from "../types";

/**
 * 기존 항목의 내용으로 새 항목 창에 채울 값 (편집 폼에 있는 칸만).
 * 작성일은 오늘로 한다.
 *   markCopy: 같은 자리에 복제할 때 — 제목에 '(복사본)' 을 붙이고 공개를 끈다
 */
export function copyValues(
  entity: EntityType,
  row: Record<string, unknown>,
  { markCopy = false }: { markCopy?: boolean } = {},
): Record<string, unknown> {
  const copy: Record<string, unknown> = {};
  for (const field of ENTITIES[entity].groups.flatMap((g) => g.fields)) {
    if (field.key in row) copy[field.key] = row[field.key];
  }
  copy.created_date = today();
  if (markCopy) {
    const title = row.title as Localized | null | undefined;
    if (title?.ko) copy.title = { ...title, ko: `${title.ko} (복사본)` };
    copy.is_published = false;
  }
  return copy;
}
