import { describe, expect, it } from "vitest";
import { normalizeDriveReversal, normalizeOptions, normalizePractice } from "./setup";

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