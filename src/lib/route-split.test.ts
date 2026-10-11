import { describe, expect, it } from "vitest";
import { splitRoutes } from "./route-split";
import { emptyRoute } from "./combo-routes";
import type { ComboRoute } from "./types";

const r = (classic: string, extra: Partial<ComboRoute> = {}): ComboRoute => ({ ...emptyRoute(), classic, ...extra });

describe("splitRoutes", () => {
  it("공통 앞부분을 루트로, 나머지를 마무리로 (데미지 · 후상황은 마무리로)", () => {
    const { routes, groups } = splitRoutes([
      r("236hk > 214hk(2) > 623hp", { damage: 2800, frame_after: "+30" }),
      r("236hk > 214hk(2) > 236236k", { damage: 4200 }),
      r("236hk > 214hk(2) > 623hp(1) > 236236P", { damage: 4500, ender_id: 7 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(routes).toHaveLength(1);
    expect(routes[0].classic).toBe("236hk → 214hk(2)");
    expect(routes[0].damage).toBeNull();
    expect(routes[0].finishes).toEqual([
      { classic: "623hp", modern: null, damage: 2800, frame_after: "+30", ender_id: null, note: null },
      { classic: "236236k", modern: null, damage: 4200, frame_after: null, ender_id: null, note: null },
      { classic: "623hp(1) → 236236P", modern: null, damage: 4500, frame_after: null, ender_id: 7, note: null },
    ]);
  });

  it("가장 길게 겹치는 것끼리 묶고, 겹치지 않는 루트와 마무리가 빈 칸이 되는 루트는 그대로", () => {
    const { routes, groups } = splitRoutes([
      r("236mk"),
      r("236mk > 236236K"),
      r("2HP > 236MK > SA1"),
      r("2HP > 236MK > SA2"),
      r("2HP > DRC > 2HP > 214HK"),
      r("214mp"),
    ]);
    expect(groups.map((g) => g.prefix)).toEqual(["2HP → 236MK"]);
    expect(routes.map((x) => x.classic)).toEqual(["236mk", "236mk > 236236K", "2HP → 236MK", "2HP > DRC > 2HP > 214HK", "214mp"]);
  });

  it("가장 길게 겹치는 짝부터: 타겟 콤보 루트는 따로 두고 같은 중간 루트끼리 묶는다", () => {
    const { routes } = splitRoutes([r("dr > mp..hk..hk"), r("dr > mp > 236mk > 236236k"), r("dr > mp > 236mk > 214214p")]);
    expect(routes.map((x) => x.classic)).toEqual(["dr > mp..hk..hk", "dr → mp → 236mk"]);
    expect(routes[1].finishes.map((f) => f.classic)).toEqual(["236236k", "214214p"]);
  });

  it("두 루트 이상이 같은 앞부분이면 묶는다 (236mk 를 공유하는 두 루트)", () => {
    const { routes } = splitRoutes([r("236mk"), r("236mk > 236236K"), r("236mk > 214214p..pp")]);
    expect(routes.map((x) => x.classic)).toEqual(["236mk", "236mk"]);
    expect(routes[1].finishes.map((f) => f.classic)).toEqual(["236236K", "214214p..pp"]);
  });

  it("이미 마무리가 있는 루트는 그 루트로 시작하는 루트를 마무리로 더 받는다", () => {
    const { routes } = splitRoutes([
      r("623HP", { finishes: [{ classic: "236P", modern: null, damage: 2000, frame_after: null, ender_id: null }] }),
      r("623HP > 623LP", { damage: 2100 }),
    ]);
    expect(routes).toHaveLength(1);
    expect(routes[0].finishes.map((f) => [f.classic, f.damage])).toEqual([
      ["236P", 2000],
      ["623LP", 2100],
    ]);
  });

  it("모던도 같은 방식으로 나눈다. 섞여 있거나 메모가 다르면 묶지 않고 이유를 알려 준다", () => {
    const ok = splitRoutes([r("2MP > 236HP > SA1", { modern: "2M > SP > A+H" }), r("2MP > 236HP > SA2", { modern: "2M > SP > A+M" })]);
    expect(ok.routes[0].modern).toBe("2M → SP");
    expect(ok.routes[0].finishes.map((f) => f.modern)).toEqual(["A+H", "A+M"]);

    const mixed = splitRoutes([r("2MP > 236HP > SA1", { modern: "2M > SP > A+H" }), r("2MP > 236HP > SA2")]);
    expect(mixed.groups).toHaveLength(0);
    expect(mixed.skipped[0].reason).toContain("모던");

  });

  it("루트별 메모: 모두 같으면 묶은 루트에, 다르면 마무리마다", () => {
    const same = splitRoutes([r("2MP > 236HP > SA1", { note: { ko: "공통" } }), r("2MP > 236HP > SA2", { note: { ko: "공통" } })]);
    expect(same.routes[0].note).toEqual({ ko: "공통" });
    expect(same.routes[0].finishes.map((f) => f.note)).toEqual([null, null]);

    const diff = splitRoutes([r("2MP > 236HP > SA1"), r("2MP > 236HP > SA2", { note: { ko: "구석 한정" } })]);
    expect(diff.routes[0].note).toBeNull();
    expect(diff.routes[0].finishes.map((f) => f.note)).toEqual([null, { ko: "구석 한정" }]);
  });

  it("묶을 것이 없으면 그대로", () => {
    const input = [r("214mp"), r("236lk")];
    expect(splitRoutes(input)).toEqual({ routes: input, groups: [], skipped: [] });
  });
});
