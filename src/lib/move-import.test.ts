import { describe, expect, it } from "vitest";
import { DEFAULT_COLUMNS, detectHeader, parseCategory, readRow, splitTable } from "./move-import";

describe("splitTable", () => {
  it("탭으로 나눈다 (엑셀·시트)", () => {
    expect(splitTable("서서 약펀치\t5LP\t300\r\n\n앉아 중킥\t2MK\t500\n")).toEqual([
      ["서서 약펀치", "5LP", "300"],
      ["앉아 중킥", "2MK", "500"],
    ]);
  });

  it("탭이 없으면 쉼표로", () => {
    expect(splitTable("5LP, 300, 4")).toEqual([["5LP", "300", "4"]]);
  });
});

describe("detectHeader", () => {
  it("한국어·영어 제목 줄을 알아본다", () => {
    expect(detectHeader(["이름", "커맨드", "데미지", "발생", "지속", "경직", "히트", "가드"])).toEqual(DEFAULT_COLUMNS);
    expect(detectHeader(["Move", "Input", "Damage", "Startup", "Active", "Recovery", "On Hit", "On Block"])).toEqual(
      DEFAULT_COLUMNS,
    );
  });

  it("모르는 제목은 쓰지 않음으로", () => {
    expect(detectHeader(["분류", "이름", "커맨드", "Cancel"])).toEqual(["category", "name", "input_classic", "skip"]);
  });

  it("데이터 줄은 제목으로 보지 않는다", () => {
    expect(detectHeader(["서서 약펀치", "5LP", "300", "4"])).toBeNull();
  });
});

describe("parseCategory", () => {
  it("여러 표기를 분류로", () => {
    expect(parseCategory("필살기")).toBe("special");
    expect(parseCategory("Super Arts")).toBe("super");
    expect(parseCategory("SA2")).toBe("super");
    expect(parseCategory("Command Normal")).toBe("unique");
    expect(parseCategory("타겟 콤보")).toBe("target_combo");
    expect(parseCategory("무엇")).toBeNull();
  });
});

describe("readRow", () => {
  it("열 배치대로 읽고 빈칸·'-' 는 없음으로", () => {
    expect(readRow(["서서 약펀치", "5LP", "300", "4", "3", "7", "+4", "-"], DEFAULT_COLUMNS)).toEqual({
      category: null,
      name: "서서 약펀치",
      input_classic: "5LP",
      input_modern: null,
      damage: "300",
      startup: "4",
      active: "3",
      recovery: "7",
      on_hit: "+4",
      on_block: null,
      notes: null,
    });
  });
});
