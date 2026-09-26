import type { Localized, VsAction } from "./types";

/** 저장된 선택지 목록을 맞춘다 (표기도 설명도 없는 것은 버린다) */
export function normalizeVsActions(raw: unknown): VsAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const a = v as Partial<VsAction>;
      const note = a.note && typeof a.note === "object" && (a.note as Localized).ko ? (a.note as Localized) : null;
      return {
        classic: typeof a.classic === "string" ? a.classic : "",
        modern: typeof a.modern === "string" && a.modern ? a.modern : null,
        note,
      };
    })
    .filter((a) => a.classic || a.note);
}
