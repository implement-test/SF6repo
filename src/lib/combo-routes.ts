import type { Combo, ComboRoute, Localized } from "./types";

/**
 * 콤보의 루트 목록.
 * 첫 번째 루트는 기존 칼럼(notation_classic, damage …, 메모는 route_note)에,
 * 2번째부터는 extra_routes(jsonb)에 저장한다.
 * 셋업 연결 등 루트 하나만 쓰는 곳은 계속 칼럼(= 첫 번째 루트)을 쓴다.
 */
export function comboRoutes(
  c: Pick<Combo, "notation_classic" | "notation_modern" | "damage" | "drive_cost" | "sa_cost" | "frame_after"> & {
    extra_routes?: unknown;
    route_note?: unknown;
  },
): ComboRoute[] {
  const first: ComboRoute = {
    classic: c.notation_classic ?? "",
    modern: c.notation_modern ?? null,
    damage: c.damage ?? null,
    drive_cost: c.drive_cost ?? 0,
    sa_cost: c.sa_cost ?? 0,
    frame_after: c.frame_after ?? null,
    note: toLocalized(c.route_note),
  };
  return [first, ...normalizeExtraRoutes(c.extra_routes)];
}

function toLocalized(raw: unknown): Localized | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<Localized>;
  return typeof l.ko === "string" && l.ko ? (l as Localized) : null;
}

export function normalizeExtraRoutes(raw: unknown): ComboRoute[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const r = v as Partial<ComboRoute>;
      return {
        classic: typeof r.classic === "string" ? r.classic : "",
        modern: typeof r.modern === "string" && r.modern ? r.modern : null,
        damage: typeof r.damage === "number" ? r.damage : null,
        drive_cost: typeof r.drive_cost === "number" ? r.drive_cost : 0,
        sa_cost: typeof r.sa_cost === "number" ? r.sa_cost : 0,
        frame_after: typeof r.frame_after === "string" && r.frame_after ? r.frame_after : null,
        note: toLocalized(r.note),
      };
    })
    .filter((r) => r.classic);
}

export const emptyRoute = (): ComboRoute => ({
  classic: "",
  modern: null,
  damage: null,
  drive_cost: 0,
  sa_cost: 0,
  frame_after: null,
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

/**
 * 편집한 루트 목록을 저장할 칼럼으로 나눈다. 클래식 표기가 빈 루트는 버린다.
 * 루트가 하나도 없으면 "empty", 메모에 한국어가 빠졌으면 "missing-ko".
 */
export function routesToColumns(routes: ComboRoute[]): Record<string, unknown> | "empty" | "missing-ko" {
  const cleaned = routes
    .map((r) => ({
      classic: r.classic.trim(),
      modern: r.modern?.trim() || null,
      damage: typeof r.damage === "number" ? r.damage : null,
      drive_cost: typeof r.drive_cost === "number" ? r.drive_cost : 0,
      sa_cost: typeof r.sa_cost === "number" ? r.sa_cost : 0,
      frame_after: r.frame_after?.trim() || null,
      note: cleanNote(r.note),
    }))
    .filter((r) => r.classic);
  if (cleaned.length === 0) return "empty";
  if (cleaned.some((r) => r.note === "missing-ko")) return "missing-ko";
  const [first, ...rest] = cleaned as (Omit<ComboRoute, "note"> & { note: Localized | null })[];
  return {
    notation_classic: first.classic,
    notation_modern: first.modern,
    damage: first.damage,
    drive_cost: first.drive_cost,
    sa_cost: first.sa_cost,
    frame_after: first.frame_after,
    route_note: first.note,
    extra_routes: rest,
  };
}
