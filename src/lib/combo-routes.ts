import type { Combo, ComboRoute } from "./types";

/**
 * 콤보의 루트 목록.
 * 첫 번째 루트는 기존 칼럼(notation_classic, damage …)에, 2번째부터는 extra_routes(jsonb)에 저장한다.
 * 셋업 연결 등 루트 하나만 쓰는 곳은 계속 칼럼(= 첫 번째 루트)을 쓴다.
 */
export function comboRoutes(
  c: Pick<Combo, "notation_classic" | "notation_modern" | "damage" | "drive_cost" | "sa_cost" | "frame_after"> & {
    extra_routes?: unknown;
  },
): ComboRoute[] {
  const first: ComboRoute = {
    classic: c.notation_classic ?? "",
    modern: c.notation_modern ?? null,
    damage: c.damage ?? null,
    drive_cost: c.drive_cost ?? 0,
    sa_cost: c.sa_cost ?? 0,
    frame_after: c.frame_after ?? null,
  };
  return [first, ...normalizeExtraRoutes(c.extra_routes)];
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
});

/**
 * 편집한 루트 목록을 저장할 칼럼으로 나눈다. 클래식 표기가 빈 루트는 버린다.
 * 루트가 하나도 없으면 null.
 */
export function routesToColumns(routes: ComboRoute[]): Record<string, unknown> | null {
  const cleaned = routes
    .map((r) => ({
      classic: r.classic.trim(),
      modern: r.modern?.trim() || null,
      damage: typeof r.damage === "number" ? r.damage : null,
      drive_cost: typeof r.drive_cost === "number" ? r.drive_cost : 0,
      sa_cost: typeof r.sa_cost === "number" ? r.sa_cost : 0,
      frame_after: r.frame_after?.trim() || null,
    }))
    .filter((r) => r.classic);
  if (cleaned.length === 0) return null;
  const [first, ...rest] = cleaned;
  return {
    notation_classic: first.classic,
    notation_modern: first.modern,
    damage: first.damage,
    drive_cost: first.drive_cost,
    sa_cost: first.sa_cost,
    frame_after: first.frame_after,
    extra_routes: rest,
  };
}
