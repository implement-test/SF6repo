import { describe, expect, it } from "vitest";
import { damageBasisIndex, flattenStarters, normalizeStarterGroups } from "./starters";

describe("damageBasisIndex", () => {
  const groups = [
    { name: "A", starters: [{ classic: "2LP", modern: null }, { classic: "5LP", modern: null }] },
    { name: "B", starters: [{ classic: "5MP", modern: null, damage_basis: true }] },
  ];

  it("고른 시동기의 전체 번호", () => {
    expect(damageBasisIndex(groups)).toBe(2);
  });

  it("고른 것이 없으면 첫 번째, 시동기가 없으면 -1", () => {
    expect(damageBasisIndex([{ name: null, starters: [{ classic: "2LP", modern: null }] }])).toBe(0);
    expect(damageBasisIndex([])).toBe(-1);
  });

  it("저장된 기준 표시를 유지한다", () => {
    expect(normalizeStarterGroups(groups)[1].starters[0].damage_basis).toBe(true);
  });
});

describe("normalizeStarterGroups", () => {
  it("예전 형식(시동기 목록)은 이름 없는 그룹 하나로", () => {
    expect(normalizeStarterGroups([{ classic: "2LP", modern: null }, { classic: "5MP", modern: "5M" }])).toEqual([
      {
        name: null,
        starters: [
          { classic: "2LP", modern: null },
          { classic: "5MP", modern: "5M" },
        ],
      },
    ]);
  });

  it("그룹 형식은 그대로 (빈 이름은 null)", () => {
    const groups = [
      { name: "약 시동", starters: [{ classic: "2LP", modern: null }] },
      { name: " ", starters: [{ classic: "5MP", modern: null }] },
    ];
    expect(normalizeStarterGroups(groups)).toEqual([
      { name: "약 시동", starters: [{ classic: "2LP", modern: null }] },
      { name: null, starters: [{ classic: "5MP", modern: null }] },
    ]);
  });

  it("비었거나 이상한 값은 빈 목록", () => {
    expect(normalizeStarterGroups([])).toEqual([]);
    expect(normalizeStarterGroups(null)).toEqual([]);
  });

  it("그룹을 넘어 순서대로 펼친다", () => {
    expect(
      flattenStarters([
        { name: "A", starters: [{ classic: "2LP", modern: null }] },
        { name: "B", starters: [{ classic: "5MP", modern: null }] },
      ]).map((s) => s.classic),
    ).toEqual(["2LP", "5MP"]);
  });
});
