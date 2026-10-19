import { describe, expect, it } from "vitest";
import { cleanOptions } from "./setup-fields";

describe("cleanOptions: 조건(직접 입력) 분기", () => {
  it("조건 이름만 있어도 분기를 남기고, custom 이 아니면 label 을 지운다", () => {
    const [o] = cleanOptions([
      {
        label: "옵션 1",
        classic: "2MK",
        modern: null,
        description: null,
        youtube_url: null,
        branches: [
          { result: "custom", label: { ko: " 상대가 점프하면 " }, classic: "", modern: null, note: null },
          { result: "guard", label: { ko: "남으면 안 됨" }, classic: "4", modern: null, note: null },
          { result: "custom", label: null, classic: "", modern: null, note: null },
        ],
      },
    ]);
    expect(o.branches).toEqual([
      { result: "custom", label: { ko: "상대가 점프하면" }, classic: "", modern: null, note: null },
      { result: "guard", label: null, classic: "4", modern: null, note: null },
    ]);
  });
});
