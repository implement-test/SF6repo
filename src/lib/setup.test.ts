import { describe, expect, it } from "vitest";
import {
  editableVariants,
  normalizeDriveReversal,
  normalizeOptions,
  normalizePractice,
  normalizeVariantLinks,
  setupVariants,
  variantLinks,
} from "./setup";

describe("normalizePractice", () => {
  it("초기 형식(표기 문자열 슬롯)을 표 형식으로 바꾼다", () => {
    const p = normalizePractice({
      guard: "all",
      playback: "random",
      wakeup: ["2LP", "LPLK"],
      after_guard: { count: 2, slots: ["4"] },
      after_hit: [],
      notes: { ko: "메모" },
    });
    expect(p).toEqual({
      guard_setting: "all",
      guard_switch: null,
      drive_reversal: null,
      wakeup: [
        { command: { ko: "2LP" }, delay: null },
        { command: { ko: "LPLK" }, delay: null },
      ],
      guard: [{ command: { ko: "4" }, count: 2, delay: null }],
      after_hit: [],
      notes: { ko: "메모" },
    });
  });

  it("현재 형식은 그대로 둔다", () => {
    const current = {
      guard_setting: "count" as const,
      guard_switch: "stand" as const,
      drive_reversal: { off: 0, guard: 7, wakeup: 3 },
      wakeup: [{ command: { ko: "4F 기본기" }, delay: 0 }],
      guard: [{ command: { ko: "기본 잡기" }, count: 1, delay: 3 }],
      after_hit: [],
      notes: null,
    };
    expect(normalizePractice(current)).toEqual(current);
  });

  it("없으면 null", () => {
    expect(normalizePractice(null)).toBeNull();
  });
});

describe("normalizeOptions", () => {
  it("분기가 없던 옵션에 빈 분기를 채운다", () => {
    expect(normalizeOptions([{ label: "A", classic: "5LP", modern: null, description: null, youtube_url: null }])).toEqual([
      {
        label: "A",
        classic: "5LP",
        modern: null,
        description: null,
        branches: [],
        youtube_url: null,
        youtube_start: null,
        youtube_end: null,
        youtube_loop: false,
      },
    ]);
  });
});

describe("normalizeDriveReversal", () => {
  it("이전 형식(선택 하나)을 확률로 바꾼다", () => {
    expect(normalizeDriveReversal("guard")).toEqual({ off: 0, guard: 10, wakeup: 0 });
    expect(normalizeDriveReversal("random")).toEqual({ off: 5, guard: 5, wakeup: 5 });
  });

  it("0~10 으로 맞춘다", () => {
    expect(normalizeDriveReversal({ off: -2, guard: 12, wakeup: 3.6 })).toEqual({ off: 0, guard: 10, wakeup: 4 });
  });

  it("없으면 null", () => {
    expect(normalizeDriveReversal(null)).toBeNull();
    expect(normalizeDriveReversal("unknown")).toBeNull();
  });
});
describe("옵션 분기: 조건(직접 입력)", () => {
  it("custom 결과는 조건 이름(label)을 남기고, 다른 결과는 label 을 버린다", () => {
    const [o] = normalizeOptions([
      {
        label: "옵션 1",
        classic: "2MK",
        branches: [
          { result: "custom", label: { ko: "상대가 점프하면" }, classic: "623HP" },
          { result: "hit", label: { ko: "무시" }, classic: "236HK" },
        ],
      },
    ]);
    expect(o.branches[0]).toMatchObject({ result: "custom", label: { ko: "상대가 점프하면" }, classic: "623HP" });
    expect(o.branches[1].label).toBeNull();
  });
});

describe("셋업 포스트의 셋업 여러 개 (0031)", () => {
  const legacy = {
    notation_classic: "66 > 5MP",
    notation_modern: null,
    options: [{ label: "옵션 1", classic: "2LP", branches: [] }],
    practice: null,
  };

  it("variants 가 비어 있으면 예전 칼럼이 셋업 하나", () => {
    const list = setupVariants({ ...legacy, options: legacy.options as never, variants: [] });
    expect(list).toHaveLength(1);
    expect(list[0].notation_classic).toBe("66 > 5MP");
    expect(list[0].options[0].classic).toBe("2LP");
  });

  it("variants 가 있으면 그것 (예전 칼럼은 무시)", () => {
    const list = setupVariants({ ...legacy, options: [], variants: [{ name: { ko: "A" } }, { notation_classic: "2MK" }] });
    expect(list.map((v) => v.name?.ko ?? null)).toEqual(["A", null]);
    expect(list[1].notation_classic).toBe("2MK");
    expect(list[1].options).toEqual([]);
  });

  it("편집 창: DB 의 연결을 셋업마다 나누고, 예전 형식(엔더 id 목록)은 첫 번째 셋업", () => {
    const row = { ...legacy, variants: [{}, {}], ender_links: [{ ender_id: 1, variant: 0 }, { ender_id: 2, variant: 1 }, { ender_id: 3, variant: 5 }] };
    expect(editableVariants(row).map((v) => v.ender_ids)).toEqual([[1], [2, 3]]);
    expect(editableVariants({ ...legacy, ender_links: [4, 5] }).map((v) => v.ender_ids)).toEqual([[4, 5]]);
    // 임시 내용처럼 셋업 안에 엔더가 들어 있으면 그대로
    expect(editableVariants({ ...legacy, variants: [{ ender_ids: [7] }] })[0].ender_ids).toEqual([7]);
  });

  it("저장할 연결: 같은 엔더는 앞 셋업 하나에만", () => {
    expect(variantLinks([{ ender_ids: [1, 2] }, { ender_ids: [2, 3] }])).toEqual([
      { ender_id: 1, variant: 0 },
      { ender_id: 2, variant: 0 },
      { ender_id: 3, variant: 1 },
    ]);
    expect(normalizeVariantLinks([{ ender_id: 1 }, 2, "x"])).toEqual([
      { ender_id: 1, variant: 0 },
      { ender_id: 2, variant: 0 },
    ]);
  });
});
