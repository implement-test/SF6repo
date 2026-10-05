import type { Combo, ComboFinish, ComboRoute, Localized } from "./types";

/**
 * 콤보의 루트 목록.
 * 첫 번째 루트는 기존 칼럼(notation_classic, damage …, 메모는 route_note, 마무리는 finishes, 엔더는 ender_id)에,
 * 2번째부터는 extra_routes(jsonb)에 저장한다.
 * 셋업 연결 등 루트 하나만 쓰는 곳은 계속 칼럼(= 첫 번째 루트)을 쓴다.
 */
export function comboRoutes(
  c: Pick<Combo, "notation_classic" | "notation_modern" | "damage" | "frame_after"> & {
    extra_routes?: unknown;
    route_note?: unknown;
    finishes?: unknown;
    ender_id?: number | null;
  },
): ComboRoute[] {
  const first: ComboRoute = {
    classic: c.notation_classic ?? "",
    modern: c.notation_modern ?? null,
    damage: c.damage ?? null,
    frame_after: c.frame_after ?? null,
    ender_id: typeof c.ender_id === "number" ? c.ender_id : null,
    finishes: normalizeFinishes(c.finishes),
    note: toLocalized(c.route_note),
  };
  return [first, ...normalizeExtraRoutes(c.extra_routes)];
}

function toLocalized(raw: unknown): Localized | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<Localized>;
  return typeof l.ko === "string" && l.ko ? (l as Localized) : null;
}

const numberOrNull = (v: unknown) => (typeof v === "number" ? v : null);
const textOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);

export function normalizeFinishes(raw: unknown): ComboFinish[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const f = v as Partial<ComboFinish>;
      return {
        classic: typeof f.classic === "string" ? f.classic : "",
        modern: textOrNull(f.modern),
        damage: numberOrNull(f.damage),
        frame_after: textOrNull(f.frame_after),
        ender_id: numberOrNull(f.ender_id),
      };
    })
    .filter((f) => f.classic);
}

export function normalizeExtraRoutes(raw: unknown): ComboRoute[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const r = v as Partial<ComboRoute>;
      return {
        classic: typeof r.classic === "string" ? r.classic : "",
        modern: textOrNull(r.modern),
        damage: numberOrNull(r.damage),
        frame_after: textOrNull(r.frame_after),
        ender_id: numberOrNull(r.ender_id),
        finishes: normalizeFinishes(r.finishes),
        note: toLocalized(r.note),
      };
    })
    .filter((r) => r.classic);
}

export const emptyFinish = (): ComboFinish => ({ classic: "", modern: null, damage: null, frame_after: null, ender_id: null });

export const emptyRoute = (): ComboRoute => ({
  classic: "",
  modern: null,
  damage: null,
  frame_after: null,
  ender_id: null,
  finishes: [],
  note: null,
});

/** 메모 정리: 빈 언어는 빼고, 아무것도 없으면 null. 한국어 없이 다른 언어만 있으면 "missing-ko" */
export function cleanNote(note: Partial<Localized> | null | undefined): Localized | null | "missing-ko" {
  const out: Partial<Localized> = {};
  for (const key of ["ko", "en", "ja"] as const) {
    const text = note?.[key]?.trim();
    if (text) out[key] = text;
  }
  if (Object.keys(out).length === 0) return null;
  return out.ko ? (out as Localized) : "missing-ko";
}

function cleanFinishes(finishes: ComboFinish[] | undefined): ComboFinish[] {
  return (finishes ?? [])
    .map((f) => ({
      classic: f.classic.trim(),
      modern: f.modern?.trim() || null,
      damage: typeof f.damage === "number" ? f.damage : null,
      frame_after: f.frame_after?.trim() || null,
      ender_id: typeof f.ender_id === "number" ? f.ender_id : null,
    }))
    .filter((f) => f.classic);
}

/**
 * 편집한 루트 목록을 저장할 칼럼으로 나눈다. 클래식 표기가 빈 루트·마무리는 버린다.
 * 마무리가 있는 루트는 데미지·후상황을 마무리마다 적으므로 루트의 값은 비운다.
 * 루트가 하나도 없으면 "empty", 메모에 한국어가 빠졌으면 "missing-ko".
 */
export function routesToColumns(routes: ComboRoute[]): Record<string, unknown> | "empty" | "missing-ko" {
  const cleaned = routes
    .map((r) => {
      const finishes = cleanFinishes(r.finishes);
      return {
        classic: r.classic.trim(),
        modern: r.modern?.trim() || null,
        damage: finishes.length === 0 && typeof r.damage === "number" ? r.damage : null,
        frame_after: (finishes.length === 0 && r.frame_after?.trim()) || null,
        ender_id: finishes.length === 0 && typeof r.ender_id === "number" ? r.ender_id : null,
        finishes,
        note: cleanNote(r.note),
      };
    })
    .filter((r) => r.classic);
  if (cleaned.length === 0) return "empty";
  if (cleaned.some((r) => r.note === "missing-ko")) return "missing-ko";
  const [first, ...rest] = cleaned as (Omit<ComboRoute, "note"> & { note: Localized | null })[];
  return {
    notation_classic: first.classic,
    notation_modern: first.modern,
    damage: first.damage,
    frame_after: first.frame_after,
    ender_id: first.ender_id,
    finishes: first.finishes,
    route_note: first.note,
    extra_routes: rest,
  };
}
