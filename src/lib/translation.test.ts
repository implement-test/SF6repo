import { describe, expect, it } from "vitest";
import { countMissingTranslations } from "./translation";

describe("countMissingTranslations", () => {
  it("안쪽 글까지 영어·일본어가 빠진 곳을 센다", () => {
    const row = {
      id: 1,
      title: { ko: "제목", en: "Title" },
      body: { ko: "내용", en: "Body", ja: "内容" },
      actions: [{ classic: "5LP", note: { ko: "설명" } }, { classic: "2MK", note: null }],
      pros: [{ ko: "장점", ja: "長所" }],
    };
    expect(countMissingTranslations(row)).toEqual({ en: 2, ja: 2 });
  });

  it("한국어가 비어 있는 글과 다국어가 아닌 값은 세지 않는다", () => {
    expect(countMissingTranslations({ title: { ko: "" }, notation: "5LP", n: 3, empty: null })).toEqual({ en: 0, ja: 0 });
  });

  it("공백만 있는 번역은 빠진 것으로 본다", () => {
    expect(countMissingTranslations({ name: { ko: "기술", en: " ", ja: "技" } })).toEqual({ en: 1, ja: 0 });
  });
});
