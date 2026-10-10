import { describe, expect, it } from "vitest";
import { displayNotation, findUnknownTokens, normalizeNotation, parseNotation, parseNotationSegments } from "./parse";
import { directionIcons } from "./icons";

describe("normalizeNotation", () => {
  it("입력 편의 기호를 표준 기호로 바꾼다", () => {
    expect(normalizeNotation("2MK>5HP -> 236HP")).toBe("2MK → 5HP → 236HP");
    expect(normalizeNotation("MP ・ HP")).toBe("MP·HP");
    expect(normalizeNotation("MP .. HP")).toBe("MP·HP");
  });

  it("말줄임(...)과 f.throw 의 점은 타겟 콤보가 아니다", () => {
    expect(normalizeNotation("(잠깐...) f.throw")).toBe("(잠깐...) f.throw");
  });
});

describe("이 중 하나 ::", () => {
  it("한 단계 안의 :: 를 선택지로 묶는다 (선택지마다 타겟 콤보 · 수식어 가능)", () => {
    const combo = parseNotation("2MP → 5HP :: 2HP :: DRC MP..HP → 236HP");
    expect(combo).toHaveLength(3);
    expect(combo[1]).toEqual([
      {
        kind: "or",
        options: [
          [{ kind: "input", modifiers: [], direction: null, buttons: ["HP"] }],
          [{ kind: "input", modifiers: [], direction: "2", buttons: ["HP"] }],
          [
            { kind: "input", modifiers: ["DRC"], direction: null, buttons: ["MP"] },
            { kind: "input", modifiers: [], direction: null, buttons: ["HP"] },
          ],
        ],
      },
    ]);
    expect(findUnknownTokens(combo)).toEqual([]);
  });

  it("선택지 안의 해석 못 한 조각도 찾는다, 텍스트로는 /", () => {
    expect(findUnknownTokens(parseNotation("5HP :: 뭔가"))).toEqual(["뭔가"]);
    expect(displayNotation("5hp::2hp > 236hp")).toBe("5HP / 2HP → 236HP");
  });
});

describe("생략 가능 구간 {}", () => {
  it("중괄호 안을 생략 가능 조각으로 나눈다 (경계의 → 는 뗀다)", () => {
    const segs = parseNotationSegments("2MP → {DRC 5HP →} 236HP");
    expect(segs.map((s) => s.optional)).toEqual([false, true, false]);
    expect(segs[1].combo).toEqual([[{ kind: "input", modifiers: ["DRC"], direction: null, buttons: ["HP"] }]]);
    expect(segs[2].combo).toHaveLength(1);
  });

  it("전체 해석에서는 중괄호를 무시해 해석 못 한 조각이 생기지 않는다", () => {
    const combo = parseNotation("2MP → {DRC → 5HP} → 236HP");
    expect(combo).toHaveLength(4);
    expect(findUnknownTokens(combo)).toEqual([]);
  });
});

describe("DR · DRC · SA", () => {
  it("DR · DRC 를 기술 앞에 붙이면 한 묶음이 된다", () => {
    expect(parseNotation("DRC 5HP → dr 2MP")).toEqual([
      [{ kind: "input", modifiers: ["DRC"], direction: null, buttons: ["HP"] }],
      [{ kind: "input", modifiers: ["DR"], direction: "2", buttons: ["MP"] }],
    ]);
    expect(parseNotation("counter DRC 5HP")[0][0]).toMatchObject({ modifiers: ["counter", "DRC"] });
  });

  it("단독 DR · DRC 는 그대로 시스템 기호", () => {
    expect(parseNotation("drc → 5HP")[0][0]).toEqual({ kind: "system", modifiers: [], value: "DRC" });
  });

  it("sa1 · sa2 · sa3 는 슈퍼 아츠", () => {
    const combo = parseNotation("2MP → sa1 → SA2 → sa3");
    expect(combo.slice(1).map((s) => s[0])).toEqual([
      { kind: "system", modifiers: [], value: "SA1" },
      { kind: "system", modifiers: [], value: "SA2" },
      { kind: "system", modifiers: [], value: "SA3" },
    ]);
    expect(findUnknownTokens(combo)).toEqual([]);
    expect(displayNotation("2mp > drc 5hp > sa3")).toBe("2MP → DRC 5HP → SA3");
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
    const combo = parseNotation("MP..HP → DRC → 5HP");
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
    expect(displayNotation("2mp -> drc > 5hp・hp")).toBe("2MP → DRC → 5HP..HP");
    expect(displayNotation("mp..hp (약·중)")).toBe("MP..HP (약·중)");
    expect(displayNotation("j.hp > 5pp > 236kk")).toBe("j.HP → 5PP → 236KK");
    expect(displayNotation("2m > sp")).toBe("2M → SP");
  });

  it("괄호 안 메모와 일반 단어는 그대로", () => {
    expect(displayNotation("(hold lp) delay 5hp > f.throw")).toBe("(hold lp) delay 5HP → f.throw");
    expect(displayNotation("punish 5hp")).toBe("punish 5HP");
  });
});

describe("parry", () => {
  it("j.parry 는 저스트 패리 (parry 와 다른 기호)", () => {
    expect(parseNotation("j.parry → 5HP")[0][0]).toEqual({ kind: "system", modifiers: [], value: "JPARRY" });
    expect(parseNotation("J.Parry")[0][0]).toEqual({ kind: "system", modifiers: [], value: "JPARRY" });
    expect(findUnknownTokens(parseNotation("punish j.parry → 2MP"))).toEqual([]);
    expect(displayNotation("j.parry > parry > 5hp")).toBe("J.Parry → PARRY → 5HP");
  });

  it("parry 는 패리 시스템 기호", () => {
    expect(parseNotation("parry → 5HP")[0][0]).toEqual({ kind: "system", modifiers: [], value: "PARRY" });
    expect(findUnknownTokens(parseNotation("punish parry → 2MP"))).toEqual([]);
  });

  it("텍스트로는 PARRY", () => {
    expect(displayNotation("parry > 5hp")).toBe("PARRY → 5HP");
  });
});

describe("etc", () => {
  it("etc 는 '이후 자유롭게' 표시로 읽는다 (대소문자 · 마침표 무관)", () => {
    expect(parseNotation("2MP → 236HP → etc")[2]).toEqual([{ kind: "etc" }]);
    expect(parseNotation("2MP > ETC.")[1]).toEqual([{ kind: "etc" }]);
    expect(findUnknownTokens(parseNotation("2MP → etc"))).toEqual([]);
  });

  it("텍스트 표기에서는 그대로 둔다", () => {
    expect(displayNotation("2mp > etc")).toBe("2MP → etc");
  });
});
