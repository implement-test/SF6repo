import { describe, expect, it } from "vitest";
import { displayNotation, findUnknownTokens, normalizeNotation, parseNotation } from "./parse";
import { directionIcons } from "./icons";

describe("normalizeNotation", () => {
  it("입력 편의 기호를 표준 기호로 바꾼다", () => {
    expect(normalizeNotation("2MK>5HP -> 236HP")).toBe("2MK → 5HP → 236HP");
    expect(normalizeNotation("MP ・ HP")).toBe("MP·HP");
  });
});

describe("parseNotation", () => {
  it("연결과 방향+버튼을 해석한다", () => {
    expect(parseNotation("2MK → 236HP")).toEqual([
      [{ kind: "input", modifiers: [], direction: "2", buttons: ["MK"] }],
      [{ kind: "input", modifiers: [], direction: "236", buttons: ["HP"] }],
    ]);
  });

  it("5(중립)는 방향 없음으로 처리한다", () => {
    expect(parseNotation("5HP")[0][0]).toMatchObject({ direction: null, buttons: ["HP"] });
  });

  it("타겟 콤보를 한 단계로 묶는다", () => {
    const combo = parseNotation("MP·HP → DRC → 5HP");
    expect(combo).toHaveLength(3);
    expect(combo[0]).toHaveLength(2);
    expect(combo[1][0]).toEqual({ kind: "system", modifiers: [], value: "DRC" });
  });

  it("PP/KK 는 펀치/킥 두 개가 된다", () => {
    expect(parseNotation("236PP")[0][0]).toMatchObject({ buttons: ["P", "P"] });
    expect(parseNotation("214KK")[0][0]).toMatchObject({ buttons: ["K", "K"] });
  });

  it("air / delay 수식어를 읽는다", () => {
    expect(parseNotation("air HP → delay 5MP")).toEqual([
      [{ kind: "input", modifiers: ["air"], direction: null, buttons: ["HP"] }],
      [{ kind: "input", modifiers: ["delay"], direction: null, buttons: ["MP"] }],
    ]);
  });

  it("guard 는 가드 상황으로 읽는다", () => {
    expect(parseNotation("guard 2LK → 5LP")[0][0]).toEqual({ kind: "input", modifiers: ["guard"], direction: "2", buttons: ["LK"] });
  });

  it("counter / punish / air 는 히트 상황으로 읽는다", () => {
    expect(parseNotation("counter 5HP → punish 2MP → air HP")).toEqual([
      [{ kind: "input", modifiers: ["counter"], direction: null, buttons: ["HP"] }],
      [{ kind: "input", modifiers: ["punish"], direction: "2", buttons: ["MP"] }],
      [{ kind: "input", modifiers: ["air"], direction: null, buttons: ["HP"] }],
    ]);
    expect(parseNotation("Counter delay 5HP")[0][0]).toMatchObject({ modifiers: ["counter", "delay"] });
  });

  it("히트 상황만 따로 써도 된다", () => {
    const combo = parseNotation("punish → 2MP");
    expect(combo[0][0]).toEqual({ kind: "input", modifiers: ["punish"], direction: null, buttons: [] });
    expect(findUnknownTokens(combo)).toEqual([]);
  });

  it("f.throw / b.throw 는 앞잡기 / 뒤잡기", () => {
    expect(parseNotation("f.throw → B.Throw → throw")).toEqual([
      [{ kind: "throw", modifiers: [], direction: "f" }],
      [{ kind: "throw", modifiers: [], direction: "b" }],
      [{ kind: "throw", modifiers: [], direction: null }],
    ]);
    expect(parseNotation("punish b.throw")[0][0]).toEqual({ kind: "throw", modifiers: ["punish"], direction: "b" });
  });

  it("5HP(2) 는 몇 번째 타격인지 읽는다", () => {
    expect(parseNotation("5HP(2) → 236HK")[0][0]).toEqual({
      kind: "input",
      modifiers: [],
      direction: null,
      buttons: ["HP"],
      hits: 2,
    });
  });

  it("조각 앞뒤의 괄호 메모를 따로 읽는다", () => {
    const combo = parseNotation("(약간 끌어서) 5HP → f.throw (4F 비벼도 잡힘)");
    expect(combo[0]).toEqual([
      { kind: "note", text: "약간 끌어서" },
      { kind: "input", modifiers: [], direction: null, buttons: ["HP"] },
    ]);
    expect(combo[1]).toEqual([
      { kind: "throw", modifiers: [], direction: "f" },
      { kind: "note", text: "4F 비벼도 잡힘" },
    ]);
    expect(findUnknownTokens(combo)).toEqual([]);
  });

  it("모던 버튼을 읽는다", () => {
    expect(parseNotation("A+M")[0][0]).toMatchObject({ buttons: ["A", "M"] });
    expect(parseNotation("6SP")[0][0]).toMatchObject({ direction: "6", buttons: ["SP"] });
    expect(parseNotation("2H")[0][0]).toMatchObject({ direction: "2", buttons: ["H"] });
  });

  it("방향만 있는 입력을 허용한다", () => {
    expect(parseNotation("4")[0][0]).toEqual({ kind: "input", modifiers: [], direction: "4", buttons: [] });
  });

  it("괄호는 메모, 해석 불가 조각은 unknown", () => {
    const combo = parseNotation("DI → (벽꽝) → foo");
    expect(combo[1][0]).toEqual({ kind: "note", text: "벽꽝" });
    expect(findUnknownTokens(combo)).toEqual(["foo"]);
  });
});

describe("directionIcons", () => {
  it("전용 아이콘이 없는 모션은 나눠서 표시한다", () => {
    expect(directionIcons("236236").map((i) => i.alt)).toEqual(["236", "236"]);
    expect(directionIcons("22").map((i) => i.alt)).toEqual(["2", "2"]);
    expect(directionIcons("41236").map((i) => i.alt)).toEqual(["4", "1", "236"]);
  });

  it("66 / 44 는 대쉬 아이콘 하나로 그린다", () => {
    expect(directionIcons("66")).toEqual([{ src: "/icons/dir-66.svg", alt: "66" }]);
    expect(directionIcons("44")).toEqual([{ src: "/icons/dir-66.svg", flip: "x", alt: "44" }]);
    expect(directionIcons("41236").map((i) => i.alt)).toEqual(["4", "1", "236"]);
    expect(parseNotation("66 → 5LP")[0][0]).toMatchObject({ kind: "input", direction: "66", buttons: [] });
  });

  it("3, 7, 8 은 기존 아이콘을 뒤집어 쓴다", () => {
    expect(directionIcons("3")[0]).toMatchObject({ src: "/icons/dir-9.webp", flip: "y" });
    expect(directionIcons("7")[0]).toMatchObject({ src: "/icons/dir-9.webp", flip: "x" });
    expect(directionIcons("8")[0]).toMatchObject({ src: "/icons/dir-2.webp", flip: "y" });
  });
});

describe("displayNotation", () => {
  it("버튼과 시스템 기호는 대문자로", () => {
    expect(displayNotation("counter 2lk > lk > 236lk")).toBe("counter 2LK → LK → 236LK");
    expect(displayNotation("2mp -> drc > 5hp・hp")).toBe("2MP → DRC → 5HP·HP");
    expect(displayNotation("j.hp > 5pp > 236kk")).toBe("j.HP → 5PP → 236KK");
    expect(displayNotation("2m > sp")).toBe("2M → SP");
  });

  it("괄호 안 메모와 일반 단어는 그대로", () => {
    expect(displayNotation("(hold lp) delay 5hp > f.throw")).toBe("(hold lp) delay 5HP → f.throw");
    expect(displayNotation("punish 5hp")).toBe("punish 5HP");
  });
});

describe("parry", () => {
  it("parry 는 저스트 패리 시스템 기호", () => {
    expect(parseNotation("parry → 5HP")[0][0]).toEqual({ kind: "system", modifiers: [], value: "PARRY" });
    expect(findUnknownTokens(parseNotation("punish parry → 2MP"))).toEqual([]);
  });

  it("텍스트로는 PARRY", () => {
    expect(displayNotation("parry > 5hp")).toBe("PARRY → 5HP");
  });
});
