import { describe, expect, it } from "vitest";
import { lastStepKey, resolveEnder, routeEnds } from "./enders";
import type { ComboEnder, ComboRoute } from "./types";

const ender = (id: number, notation: string, frame: string | null = null): ComboEnder => ({
  id,
  character_id: 1,
  notation_classic: notation,
  notation_modern: null,
  label: null,
  frame_after: frame,
  note: null,
  sort_order: id,
});
const enders = [ender(1, "214LP", "다운 +30"), ender(2, "623HP", "다운 +18"), ender(3, "214lp", "카운터 +40")];

describe("lastStepKey", () => {
  it("마지막 기술을 대문자 · 표준 기호로", () => {
    expect(lastStepKey("2MP > DRC > 2MP > MK > lk > 214mp")).toBe("214MP");
    expect(lastStepKey("2LP -> {DRC 5HP ->} 623hp")).toBe("623HP");
    expect(lastStepKey("")).toBe("");
  });
});

describe("resolveEnder", () => {
  it("시동이 달라도 마지막 기술이 같으면 같은 엔더 (sort_order 가 앞인 것)", () => {
    expect(resolveEnder("LP > 214LP", null, enders)?.id).toBe(1);
    expect(resolveEnder("2LP > 214LP", null, enders)?.id).toBe(1);
    expect(resolveEnder("2LP > 623HP", null, enders)?.id).toBe(2);
    expect(resolveEnder("2LP > 214MP", null, enders)).toBeNull();
  });

  it("직접 고른 엔더가 있으면 그것 (없어진 엔더면 자동)", () => {
    expect(resolveEnder("LP > 214LP", 3, enders)?.id).toBe(3);
    expect(resolveEnder("LP > 214LP", 99, enders)?.id).toBe(1);
  });
});

describe("routeEnds", () => {
  const route = (classic: string, patch: Partial<ComboRoute> = {}): ComboRoute => ({
    classic,
    modern: null,
    damage: null,
    frame_after: null,
    ender_id: null,
    finishes: [],
    note: null,
    ...patch,
  });

  it("후상황은 루트에 적은 값, 없으면 엔더 기본값. 마무리가 있으면 마무리마다", () => {
    const ends = routeEnds(
      [
        route("LP > 214LP"),
        route("2LP > 623HP", { frame_after: "코너 다운 +20" }),
        route("2MP > DRC > 5HP", {
          finishes: [
            { classic: "214LP", modern: null, damage: null, frame_after: null, ender_id: null },
            { classic: "623HP", modern: null, damage: null, frame_after: null, ender_id: null },
          ],
        }),
      ],
      enders,
    );
    expect(ends.map((e) => [e.routeIndex, e.finishIndex, e.ender?.id, e.frameAfter])).toEqual([
      [0, null, 1, "다운 +30"],
      [1, null, 2, "코너 다운 +20"],
      [2, 0, 1, "다운 +30"],
      [2, 1, 2, "다운 +18"],
    ]);
  });
});

describe("lastStepKey 와 이 중 하나(::)", () => {
  it("마지막 단계가 선택지면 첫 번째 선택지로 엔더를 찾는다", () => {
    expect(lastStepKey("2LP > 214LP :: 214MP")).toBe("214LP");
  });
});

describe("lastStepKey 와 etc", () => {
  it("etc 로 끝나면 끝낸 기술이 없다", () => {
    expect(lastStepKey("2MP → 236HP → etc")).toBe("");
  });
});

describe("lastStepKey 와 대괄호 묶음", () => {
  it("대괄호 묶음으로 끝나면 첫 번째 선택지의 마지막 기술", () => {
    expect(lastStepKey("2MP > [DR MP > 236HK > 623HP :: 236MP]")).toBe("623HP");
    expect(lastStepKey("[5HP :: 2HP] > 236HP")).toBe("236HP");
  });
});

describe("lastStepKey 와 데미지", () => {
  it("끝에 붙인 데미지(=1040, (1040))는 빼고 비교한다", () => {
    expect(lastStepKey("2MP > 623HP =2580")).toBe("623HP");
    expect(lastStepKey("2MP > 623HP (2580)")).toBe("623HP");
    expect(lastStepKey("2MP > [236MP =1040 :: 214MP]")).toBe("236MP");
  });
});
