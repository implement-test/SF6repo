/**
 * 콤보 표기 파서.
 *
 * 규칙 (docs/SPEC.md "콤보 표기법" 참고)
 *   2MK → 5HP → 236HP    `→` 연결/캔슬 (입력 편의상 `->`, `>` 도 허용)
 *   MP·HP                 `·` 타겟 콤보 (`・` 도 허용)
 *   236PP / 236KK         약중강 구분 없는 버튼 2개
 *   air HP                히트 상황: 공중 (counter = 카운터, punish = 퍼니시 카운터)
 *   delay 5HP             딜레이 입력
 *   DR / DRC / DI         생 드라이브 러시 / 캔슬 드라이브 러시 / 드라이브 임팩트
 *   f.throw / b.throw     앞잡기 / 뒤잡기
 *   L M H SP A            모던 버튼 (A = AUTO)
 *   (텍스트)              괄호 안은 그대로 메모로 표시
 */

/** 커맨드가 아니라 히트 상황. 커맨드와 구분되는 배지로 그린다. */
export type Situation = "air" | "counter" | "punish";
export type Modifier = Situation | "delay";

export const SITUATIONS: Situation[] = ["air", "counter", "punish"];
export const isSituation = (m: Modifier): m is Situation => (SITUATIONS as string[]).includes(m);

export type ClassicButton = "LP" | "MP" | "HP" | "LK" | "MK" | "HK" | "P" | "K";
export type ModernButton = "L" | "M" | "H" | "SP" | "A" | "ANY";
export type Button = ClassicButton | ModernButton;

export type Move =
  /** hits: "5HP(2)" 처럼 몇 번째 타격인지 */
  | { kind: "input"; modifiers: Modifier[]; direction: string | null; buttons: Button[]; hits?: number }
  | { kind: "system"; modifiers: Modifier[]; value: "DR" | "DRC" | "DI" }
  /** 잡기: f.throw = 앞잡기, b.throw = 뒤잡기, throw = 방향 없음 */
  | { kind: "throw"; modifiers: Modifier[]; direction: "f" | "b" | null }
  | { kind: "note"; text: string }
  | { kind: "unknown"; text: string };

/** 타겟 콤보(·)로 묶인 기술 묶음 */
export type Step = Move[];
/** `→` 로 연결된 전체 콤보 */
export type Combo = Step[];

const MODIFIERS: Record<string, Modifier> = { air: "air", counter: "counter", punish: "punish", delay: "delay" };
const SYSTEM = new Set(["DR", "DRC", "DI"]);

// 길이가 긴 것부터 매칭해야 HP 가 H + P 로 쪼개지지 않는다.
const BUTTON_TOKENS: [string, Button[]][] = [
  ["ANY", ["ANY"]],
  ["LP", ["LP"]],
  ["MP", ["MP"]],
  ["HP", ["HP"]],
  ["LK", ["LK"]],
  ["MK", ["MK"]],
  ["HK", ["HK"]],
  ["PP", ["P", "P"]],
  ["KK", ["K", "K"]],
  ["SP", ["SP"]],
  ["P", ["P"]],
  ["K", ["K"]],
  ["L", ["L"]],
  ["M", ["M"]],
  ["H", ["H"]],
  ["A", ["A"]],
];

/** 사용자가 편하게 입력한 기호를 표준 기호로 바꾼다. */
export function normalizeNotation(src: string): string {
  return src
    .replace(/->|>/g, "→")
    .replace(/[・•]/g, "·")
    .replace(/\s*→\s*/g, " → ")
    .replace(/\s*·\s*/g, "·")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseButtons(src: string): Button[] | null {
  const out: Button[] = [];
  let rest = src.replace(/\+/g, "");
  while (rest.length > 0) {
    const hit = BUTTON_TOKENS.find(([tok]) => rest.startsWith(tok));
    if (!hit) return null;
    out.push(...hit[1]);
    rest = rest.slice(hit[0].length);
  }
  return out.length > 0 ? out : null;
}

function parseMove(src: string): Move {
  const text = src.trim();
  if (/^\(.*\)$/.test(text)) return { kind: "note", text: text.slice(1, -1).trim() };

  const words = text.split(" ").filter(Boolean);
  const modifiers: Modifier[] = [];
  while (words.length > 1 && MODIFIERS[words[0].toLowerCase()]) {
    modifiers.push(MODIFIERS[words.shift()!.toLowerCase()]);
  }
  if (words.length !== 1) return { kind: "unknown", text };

  const word = words[0];
  const upper = word.toUpperCase();
  if (SYSTEM.has(upper)) return { kind: "system", modifiers, value: upper as "DR" | "DRC" | "DI" };

  const thr = /^(?:([fb])\.)?throw$/i.exec(word);
  if (thr) return { kind: "throw", modifiers, direction: (thr[1]?.toLowerCase() as "f" | "b" | undefined) ?? null };

  // 히트 상황만 따로 쓴 경우 (예: "counter → 5HP")
  const alone = MODIFIERS[word.toLowerCase()];
  if (alone && isSituation(alone)) {
    return { kind: "input", modifiers: [...modifiers, alone], direction: null, buttons: [] };
  }

  // "5HP(2)" = 5HP 의 2타째
  const hitMatch = /^(.+?)\((\d+)\)$/.exec(word);
  const core = hitMatch ? hitMatch[1] : word;
  const hits = hitMatch ? Number(hitMatch[2]) : undefined;

  const m = /^([1-9]*)(.*)$/.exec(core);
  if (m) {
    // 방향만 있는 입력(뒤로 걷기 4, 점프 8 등)도 허용한다.
    const buttons = m[2] === "" ? (m[1] ? [] : null) : parseButtons(m[2].toUpperCase());
    if (buttons) {
      // 5(중립)는 방향 아이콘을 표시하지 않는다.
      const direction = m[1] === "" || /^5+$/.test(m[1]) ? null : m[1];
      return hits ? { kind: "input", modifiers, direction, buttons, hits } : { kind: "input", modifiers, direction, buttons };
    }
  }
  return { kind: "unknown", text };
}

/**
 * 한 조각을 해석한다. 앞뒤에 괄호 메모가 붙을 수 있다: "(약간 끌어서) 5HP", "f.throw (4F 비벼도 잡힘)"
 */
function parsePart(part: string): Move[] {
  const lead = /^\(([^)]*)\)\s+(.+)$/.exec(part);
  if (lead) return [{ kind: "note", text: lead[1].trim() }, ...parsePart(lead[2])];
  const trail = /^(.+?)\s+\(([^)]*)\)$/.exec(part);
  if (trail) return [...parsePart(trail[1]), { kind: "note", text: trail[2].trim() }];
  return [parseMove(part)];
}

export function parseNotation(src: string): Combo {
  const normalized = normalizeNotation(src);
  if (!normalized) return [];
  return normalized.split("→").map((step) =>
    step
      .split("·")
      .map((part) => part.trim())
      .filter(Boolean)
      .flatMap(parsePart),
  );
}

/** 파싱 결과에 해석하지 못한 조각이 있는지 (관리자 입력 검증용) */
export function findUnknownTokens(combo: Combo): string[] {
  return combo.flat().flatMap((m) => (m.kind === "unknown" ? [m.text] : []));
}
