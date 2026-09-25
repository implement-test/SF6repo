import { describe, expect, it } from "vitest";
import { comboRoutes, routesToColumns } from "./combo-routes";

const base = {
  notation_classic: "2MK → 236HP",
  notation_modern: null,
  damage: 2000,
  drive_cost: 1,
  sa_cost: 0,
  frame_after: "+30",
};

describe("comboRoutes", () => {
  it("칼럼이 첫 번째 루트, extra_routes 가 그 뒤", () => {
    const routes = comboRoutes({ ...base, extra_routes: [{ classic: "2MK → 236LP", damage: 1500 }] });
    expect(routes.map((r) => r.classic)).toEqual(["2MK → 236HP", "2MK → 236LP"]);
    expect(routes[1]).toMatchObject({ damage: 1500, drive_cost: 0, sa_cost: 0, frame_after: null, modern: null });
  });

  it("extra_routes 가 없거나 이상하면 루트 하나", () => {
    expect(comboRoutes(base)).toHaveLength(1);
    expect(comboRoutes({ ...base, extra_routes: [null, { classic: "" }, "x"] })).toHaveLength(1);
  });
});

describe("routesToColumns", () => {
  it("첫 번째는 칼럼으로, 나머지는 extra_routes 로 (빈 루트는 버림)", () => {
    const cols = routesToColumns([
      { classic: " 5LP ", modern: "", damage: 300, drive_cost: 0, sa_cost: 0, frame_after: " +2 " },
      { classic: "", modern: null, damage: null, drive_cost: 0, sa_cost: 0, frame_after: null },
      { classic: "5MP", modern: "5M", damage: null, drive_cost: 1, sa_cost: 1, frame_after: null },
    ]);
    expect(cols).toMatchObject({
      notation_classic: "5LP",
      notation_modern: null,
      damage: 300,
      frame_after: "+2",
      extra_routes: [{ classic: "5MP", modern: "5M", damage: null, drive_cost: 1, sa_cost: 1, frame_after: null }],
    });
  });

  it("루트가 하나도 없으면 null", () => {
    expect(routesToColumns([])).toBeNull();
  });
});
