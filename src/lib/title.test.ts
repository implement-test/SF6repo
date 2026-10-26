import { describe, expect, it } from "vitest";
import { plainTitle, splitTitle } from "./title";

describe("제목 안의 표기", () => {
  it("백틱으로 감싼 부분만 표기 조각", () => {
    expect(splitTitle("`236hk` 국콤")).toEqual(["", "236hk", " 국콤"]);
    expect(splitTitle("강 기본기 시동 P1")).toEqual(["강 기본기 시동 P1"]);
  });

  it("글자로 쓸 때는 백틱을 떼고 텍스트 표기로", () => {
    expect(plainTitle("`214mp` +1F 상황")).toBe("214MP +1F 상황");
    expect(plainTitle("`2mk > drc` 시동")).toBe("2MK → DRC 시동");
  });
});
