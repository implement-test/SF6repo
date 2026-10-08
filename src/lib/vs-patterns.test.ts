import { describe, expect, it } from "vitest";
import { cleanVsPatterns, emptyPattern, emptyResponse, formatFrameRange, normalizeVsPatterns } from "./vs-patterns";

describe("formatFrameRange", () => {
  it("범위 · 단일 값 · 없음", () => {
    expect(formatFrameRange(-8, -12)).toBe("-8 ~ -12");
    expect(formatFrameRange(-6, null)).toBe("-6");
    expect(formatFrameRange(null, 2)).toBe("+2");
    expect(formatFrameRange(-4, -4)).toBe("-4");
    expect(formatFrameRange(null, null)).toBeNull();
  });
});

describe("normalizeVsPatterns", () => {
  it("빈 대응 · 빈 패턴은 버리고 딜캐 구분은 확정 / 거리 한정만", () => {
    const list = normalizeVsPatterns([
      {
        classic: "236P",
        frame_min: -8,
        frame_max: -12,
        responses: [
          { classic: "2MP > 236HP", punish: "confirmed" },
          { classic: "", note: null },
          { classic: "DI", punish: "weird" },
        ],
      },
      { classic: "", responses: [] },
      "x",
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].responses.map((r) => [r.classic, r.punish])).toEqual([
      ["2MP > 236HP", "confirmed"],
      ["DI", null],
    ]);
  });
});

describe("cleanVsPatterns", () => {
  it("글자를 다듬고 빈 것을 버린다", () => {
    const out = cleanVsPatterns([
      {
        ...emptyPattern(),
        classic: " 236P ",
        frame_min: -8,
        responses: [{ ...emptyResponse(), classic: " 2MP ", punish: "range" }, emptyResponse()],
      },
      emptyPattern(),
    ]);
    expect(out).toEqual([
      expect.objectContaining({ classic: "236P", frame_min: -8, responses: [{ classic: "2MP", modern: null, note: null, punish: "range" }] }),
    ]);
  });

  it("이름 · 설명에 한국어가 없으면 missing-ko, 구간 끝이 시작보다 앞이면 bad-clip", () => {
    expect(cleanVsPatterns([{ ...emptyPattern(), name: { ko: "", en: "Fireball" } }])).toBe("missing-ko");
    expect(
      cleanVsPatterns([{ ...emptyPattern(), classic: "236P", youtube_url: "https://youtu.be/abcdefghijk", youtube_start: 10, youtube_end: 5 }]),
    ).toBe("bad-clip");
  });
});
