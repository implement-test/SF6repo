import { describe, expect, it } from "vitest";
import { comboRoutes, routesToColumns } from "./combo-routes";

const base = {
  notation_classic: "2MK → 236HP",
  notation_modern: null,
  damage: 2000,
  frame_after: "+30",
};

describe("comboRoutes", () => {
  it("칼럼이 첫 번째 루트, extra_routes 가 그 뒤", () => {
    const routes = comboRoutes({ ...base, extra_routes: [{ classic: "2MK → 236LP", damage: 1500, drive_cost: 2 }] });
    expect(routes.map((r) => r.classic)).toEqual(["2MK → 236HP", "2MK → 236LP"]);
    expect(routes[1]).toEqual({
      classic: "2MK → 236LP",
      modern: null,
      damage: 1500,
      frame_after: null,
      ender_id: null,
      finishes: [],
      note: null,
    });
  });

  it("extra_routes 가 없거나 이상하면 루트 하나", () => {
    expect(comboRoutes(base)).toHaveLength(1);
    expect(comboRoutes({ ...base, extra_routes: [null, { classic: "" }, "x"] })).toHaveLength(1);
  });

  it("마무리: 루트 1은 finishes 칼럼, 나머지는 루트 안에 (표기 없는 마무리는 버림)", () => {
    const routes = comboRoutes({
      ...base,
      finishes: [{ classic: "SA3", damage: 4200, frame_after: "다운 +20" }, { classic: "" }],
      extra_routes: [{ classic: "5MP", finishes: [{ classic: "236HP", modern: "" }] }],
    });
    expect(routes[0].finishes).toEqual([{ classic: "SA3", modern: null, damage: 4200, frame_after: "다운 +20", ender_id: null }]);
    expect(routes[1].finishes).toEqual([{ classic: "236HP", modern: null, damage: null, frame_after: null, ender_id: null }]);
  });
});

describe("routesToColumns", () => {
  const r = { modern: null, damage: null, frame_after: null, ender_id: null, finishes: [], note: null };

  it("첫 번째는 칼럼으로, 나머지는 extra_routes 로 (빈 루트는 버림)", () => {
    const cols = routesToColumns([
      { ...r, classic: " 5LP ", modern: "", damage: 300, frame_after: " +2 " },
      { ...r, classic: "" },
      { ...r, classic: "5MP", modern: "5M" },
    ]);
    expect(cols).toMatchObject({
      notation_classic: "5LP",
      notation_modern: null,
      damage: 300,
      frame_after: "+2",
      finishes: [],
      extra_routes: [{ classic: "5MP", modern: "5M", damage: null, frame_after: null, finishes: [] }],
    });
  });

  it("마무리가 있으면 루트의 데미지·후상황은 비우고 마무리마다 저장한다", () => {
    const cols = routesToColumns([
      {
        ...r,
        classic: "2MK → 236HP",
        damage: 2000,
        frame_after: "+30",
        finishes: [
          { classic: " SA3 ", modern: null, damage: 4200, frame_after: " 다운 +20 ", ender_id: 7 },
          { classic: "", modern: null, damage: 1, frame_after: null, ender_id: null },
        ],
      },
    ]);
    expect(cols).toMatchObject({
      damage: null,
      frame_after: null,
      finishes: [{ classic: "SA3", modern: null, damage: 4200, frame_after: "다운 +20", ender_id: 7 }],
    });
  });

  it("루트가 하나도 없으면 empty", () => {
    expect(routesToColumns([])).toBe("empty");
  });

  it("루트 메모: 1번은 route_note, 나머지는 루트 안에. 한국어가 없으면 missing-ko", () => {
    expect(
      routesToColumns([
        { ...r, classic: "5LP", note: { ko: " 공용 아님 ", en: "" } },
        { ...r, classic: "5LP", note: { ko: "" } },
      ]),
    ).toMatchObject({ route_note: { ko: "공용 아님" }, extra_routes: [{ note: null }] });
    expect(routesToColumns([{ ...r, classic: "5LP", note: { ko: "", en: "only en" } }])).toBe("missing-ko");
  });
});
