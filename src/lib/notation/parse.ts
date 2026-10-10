/**
 * 콤보 표기 파서.
 *
 * 규칙 (docs/SPEC.md "콤보 표기법" 참고)
 *   2MK → 5HP → 236HP    `→` 연결/캔슬 (입력 편의상 `->`, `>` 도 허용)
 *   MP..HP                `..` 타겟 콤보 (마침표 2개. 예전 표기 `·` `・` 도 허용, 화면에는 `..`)
 *   236PP / 236KK         약중강 구분 없는 버튼 2개
 *   air HP                히트 상황: 공중 (counter = 카운터, punish = 퍼니시 카운터, guard = 가드시킴)
 *   delay 5HP             딜레이 입력
 *   DR / DRC / DI         생 드라이브 러시 / 캔슬 드라이브 러시 / 드라이브 임팩트
 *   DRC 5HP               DR · DRC 는 delay 처럼 기술 앞에 붙여 한 묶음으로도 쓴다 (단독도 가능)
 *   sa1 / sa2 / sa3       슈퍼 아츠 1 · 2 · 3
 *   parry / j.parry       패리 / 저스트 패리
 *   f.throw / b.throw     앞잡기 / 뒤잡기
 *   j.HP / nj.HP / bj.HP  점프 / 제자리 점프 / 뒤 점프 공격 (air 는 상대가 공중인 히트 상황이라 다르다)
 *   L M H SP A            모던 버튼 (A = AUTO)
 *   (텍스트)              괄호 안은 그대로 메모로 표시
 *   236HP =1040           = 뒤 숫자는 데미지 (노란 숫자 칩). 숫자만 든 메모 (1040) 도 데미지로 본다
 *   236HP → etc           etc = 이후 자유롭게 이어 간다 (콤보가 열려 있음)
 *   2MP → {DRC 5HP} → 236HP   중괄호 안은 통째로 생략 가능 (이미지에서 점선 상자로 묶는다)
 *   5HP :: 2HP → 236HP    콜론 2개(::)는 이 중 하나 (이미지에서 세로로 쌓고 OR 괄호, 텍스트는 /)
 *   [5HP :: DR MP → 236HK]  대괄호로 묶으면 선택지마다 → 로 여러 단계를 이어 쓴다 (텍스트는 [5HP / DR MP → 236HK])
 */

/** 커맨드가 아니라 히트 상황. 커맨드와 구분되는 배지로 그린다. */
export type Situation = "air" | "counter" | "punish" | "guard";
/** delay 와 DR · DRC 는 기술 앞에 붙는 수식어로도 쓴다 ("DRC 5HP") */
export type Modifier = Situation | "delay" | "DR" | "DRC";

export const SITUATIONS: Situation[] = ["air", "counter", "punish", "guard"];
export const isSituation = (m: Modifier): m is Situation => (SITUATIONS as string[]).includes(m);

export type SystemValue = "DR" | "DRC" | "DI" | "PARRY" | "JPARRY" | "SA1" | "SA2" | "SA3";

export type ClassicButton = "LP" | "MP" | "HP" | "LK" | "MK" | "HK" | "P" | "K";
export type ModernButton = "L" | "M" | "H" | "SP" | "A" | "ANY";
/** 점프 공격: j = 점프(앞 · 뒤 상관없음), nj = 제자리 점프, bj = 뒤 점프 */
export type Jump = "j" | "nj" | "bj";
export type Button = ClassicButton | ModernButton;

export type Move =
  /** hits: "5HP(2)" 처럼 몇 번째 타격인지. jump: "j.HP" 처럼 점프 공격 */
  | { kind: "input"; modifiers: Modifier[]; direction: string | null; buttons: Button[]; hits?: number; jump?: Jump }
  | { kind: "system"; modifiers: Modifier[]; value: SystemValue }
  /** 잡기: f.throw = 앞잡기, b.throw = 뒤잡기, throw = 방향 없음 */
  | { kind: "throw"; modifiers: Modifier[]; direction: "f" | "b" | null }
  | { kind: "note"; text: string }
  /** 데미지: "=1040" (범위 "=1040~1200"), 숫자만 든 메모 "(1040)" */
  | { kind: "damage"; text: string }
  /** etc: 이후는 자유롭게 이어 간다 */
  | { kind: "etc" }
  | { kind: "unknown"; text: string }
  /** 이 중 하나 (`5HP :: 2HP`). 선택지마다 타겟 콤보 묶음 하나 */
  | { kind: "or"; options: Move[][] }
  /** 대괄호로 묶은 이 중 하나 (`[5HP :: DR MP → 236HK]`). 선택지마다 → 로 이어진 콤보 */
  | { kind: "branch"; options: Combo[] };

/** 타겟 콤보(..)로 묶인 기술 묶음 */
export type Step = Move[];
/** `→` 로 연결된 전체 콤보 */
export type Combo = Step[];

const MODIFIERS: Record<string, Modifier> = {
  air: "air",
  counter: "counter",
  punish: "punish",
  guard: "guard",
  delay: "delay",
  dr: "DR",
  drc: "DRC",
};
const SYSTEM = new Set<string>(["DR", "DRC", "DI", "PARRY", "SA1", "SA2", "SA3"]);
/** 점이 들어간 시스템 기호 (j.parry = 저스트 패리) */
const DOTTED_SYSTEM: Record<string, SystemValue> = { "J.PARRY": "JPARRY" };

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
    // 마침표 2개(..)가 타겟 콤보. 안에서는 · 로 통일한다 (말줄임 ... 은 건드리지 않음)
    .replace(/(?<!\.)\.\.(?!\.)/g, "·")
    .replace(/[・•]/g, "·")
    .replace(/\s*→\s*/g, " → ")
    .replace(/\s*·\s*/g, "·")
    // 데미지 "= 1040" 은 붙여서 한 조각으로
    .replace(/=\s+(?=\d)/g, "=")
    .replace(/([^\s=])=(?=\d)/g, "$1 =")
    // 콜론 2개(::)가 '이 중 하나'
    .replace(/\s*::\s*/g, " :: ")
    // 대괄호 묶음은 안쪽 여백을 뗀다: "[ 5HP :: 2HP ]" → "[5HP :: 2HP]"
    .replace(/\[\s+/g, "[")
    .replace(/\s+\]/g, "]")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * 텍스트로 보여 줄 표기: 표준 기호로 바꾸고 버튼·시스템 기호를 대문자로 (2lk → 2LK, drc → DRC).
 * 저스트 패리는 패리(PARRY)와 구분되게 J.Parry 로 쓴다.
 * 타겟 콤보는 `..` 로 보여 준다. 괄호 안 메모와 counter · delay · f.throw 같은 단어는 그대로 둔다.
 */
export function displayNotation(src: string): string {
  return normalizeNotation(src)
    .split(/(\([^)]*\))/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(
              /\b(\d*)((?:lp|mp|hp|lk|mk|hk|pp|kk|sp|p|k|l|m|h)+|parry|drc|dr|di|sa[123])\b/gi,
              (_, digits: string, buttons: string) => digits + buttons.toUpperCase(),
            )
            // 점프 접두어는 소문자로 (J.HP → j.HP). 저스트 패리는 그다음에 J.Parry 로
            .replace(/\b(n|b)?j\.(?=\w)/gi, (m) => m.toLowerCase())
            .replace(/\bj\.parry\b/gi, "J.Parry")
            .replace(/·/g, "..")
            // 데미지는 띄워서: "236HP = 1040"
            .replace(/\s*=(?=\d)/g, " = ")
            .replace(/ :: /g, " / "),
    )
    .join("");
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
  if (/^\(.*\)$/.test(text)) return noteOrDamage(text.slice(1, -1));
  if (/^=/.test(text) && DAMAGE.test(text.slice(1))) return { kind: "damage", text: text.slice(1) };
  if (/^etc\.?$/i.test(text)) return { kind: "etc" };

  const words = text.split(" ").filter(Boolean);
  const modifiers: Modifier[] = [];
  while (words.length > 1 && MODIFIERS[words[0].toLowerCase()]) {
    modifiers.push(MODIFIERS[words.shift()!.toLowerCase()]);
  }
  if (words.length !== 1) return { kind: "unknown", text };

  const word = words[0];
  const upper = word.toUpperCase();
  if (SYSTEM.has(upper)) return { kind: "system", modifiers, value: upper as SystemValue };
  if (DOTTED_SYSTEM[upper]) return { kind: "system", modifiers, value: DOTTED_SYSTEM[upper] };

  const thr = /^(?:([fb])\.)?throw$/i.exec(word);
  if (thr) return { kind: "throw", modifiers, direction: (thr[1]?.toLowerCase() as "f" | "b" | undefined) ?? null };

  // 히트 상황만 따로 쓴 경우 (예: "counter → 5HP")
  const alone = MODIFIERS[word.toLowerCase()];
  if (alone && isSituation(alone)) {
    return { kind: "input", modifiers: [...modifiers, alone], direction: null, buttons: [] };
  }

  // "j.HP" / "nj.HP" / "bj.HP" = 점프 공격. 나머지는 지상 기술과 같이 읽는다 (j.2MK, j.HP(2) 도 가능)
  const jumpMatch = /^(j|nj|bj)\.(.+)$/i.exec(word);
  if (jumpMatch) {
    const rest = parseMove(jumpMatch[2]);
    if (rest.kind === "input" && rest.buttons.length > 0) {
      return { ...rest, modifiers: [...modifiers, ...rest.modifiers], jump: jumpMatch[1].toLowerCase() as Jump };
    }
    return { kind: "unknown", text };
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
  if (lead) return [noteOrDamage(lead[1]), ...parsePart(lead[2])];
  const trail = /^(.+?)\s+\(([^)]*)\)$/.exec(part);
  if (trail) return [...parsePart(trail[1]), noteOrDamage(trail[2])];
  // "236HP =1040": 끝에 붙인 데미지
  const dmg = /^(.+?)\s+=(\S+)$/.exec(part);
  if (dmg && DAMAGE.test(dmg[2])) return [...parsePart(dmg[1]), { kind: "damage", text: dmg[2] }];
  return [parseMove(part)];
}

/** 데미지 값: 1040, 범위 1040~1200 · 1040-1200 */
const DAMAGE = /^\d{1,5}(?:[~-]\d{1,5})?$/;

/** 괄호 메모. 숫자(3~5자리)만 들어 있으면 예전에 메모로 적은 데미지로 본다: "(1040)" */
function noteOrDamage(raw: string): Move {
  const text = raw.trim();
  return /^\d{3,5}(?:[~-]\d{3,5})?$/.test(text) ? { kind: "damage", text } : { kind: "note", text };
}

/** 중괄호({})를 뺀 콤보 전체. 생략 가능 구간도 그대로 이어서 읽는다 */
export function parseNotation(src: string): Combo {
  return parsePlain(src.replace(/[{}]/g, " "));
}

/** 생략 가능 구간({...})과 나머지로 나눈 조각들. 조각 사이는 → 로 이어진다 */
export type NotationSegment = { optional: boolean; combo: Combo };

export function parseNotationSegments(src: string): NotationSegment[] {
  return normalizeNotation(src)
    .split(/(\{[^{}]*\})/)
    .map((piece) => {
      const optional = piece.startsWith("{") && piece.endsWith("}");
      // 구간 경계의 → 는 조각 사이에 다시 그리므로 앞뒤에서 뗀다
      const body = (optional ? piece.slice(1, -1) : piece).replace(/^[\s→]+|[\s→]+$/g, "");
      return { optional, combo: parsePlain(body) };
    })
    .filter((seg) => seg.combo.length > 0);
}

/**
 * 대괄호 [ ] 밖에 있는 구분 기호로만 나눈다.
 * "2MP → [5HP :: DR MP → 236HK]" 를 → 로 나누면 대괄호 안의 → 는 그대로 남는다.
 */
export function splitTopLevel(src: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0 && src.startsWith(separator, i)) {
      parts.push(src.slice(start, i));
      start = i + separator.length;
      i += separator.length - 1;
    }
  }
  parts.push(src.slice(start));
  return parts;
}

/** 단계 하나가 통째로 대괄호 묶음이면 그 안쪽 (아니면 null). 맨 앞의 [ 가 맨 끝의 ] 에서 닫혀야 한다 */
export function bracketBody(step: string): string | null {
  const t = step.trim();
  if (!t.startsWith("[") || !t.endsWith("]")) return null;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "[") depth++;
    else if (t[i] === "]" && --depth === 0 && i < t.length - 1) return null;
  }
  return depth === 0 ? t.slice(1, -1) : null;
}

function parsePlain(src: string): Combo {
  const normalized = normalizeNotation(src);
  if (!normalized) return [];
  return splitTopLevel(normalized, "→").map((step) => {
    // "[5HP :: DR MP → 236HK]" = 선택지마다 여러 단계가 있는 이 중 하나
    const body = bracketBody(step);
    if (body !== null) {
      const options = splitTopLevel(body, "::").map(parsePlain).filter((o) => o.length > 0);
      return options.length > 0 ? [{ kind: "branch", options }] : [];
    }
    // "5HP :: 2HP" = 이 중 하나. 선택지마다 타겟 콤보 묶음으로 읽는다
    const options = step.split("::").map(parseChain).filter((o) => o.length > 0);
    return options.length > 1 ? [{ kind: "or", options }] : (options[0] ?? []);
  });
}

/** 타겟 콤보(..)로 묶인 기술 묶음 하나 */
function parseChain(src: string): Move[] {
  return src
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap(parsePart);
}

/** or 묶음을 풀어 모든 기술을 */
function allMoves(moves: Move[]): Move[] {
  return moves.flatMap((m) =>
    m.kind === "or" ? m.options.flatMap(allMoves) : m.kind === "branch" ? m.options.flatMap((c) => allMoves(c.flat())) : [m],
  );
}

/** 파싱 결과에 해석하지 못한 조각이 있는지 (관리자 입력 검증용) */
export function findUnknownTokens(combo: Combo): string[] {
  return allMoves(combo.flat()).flatMap((m) => (m.kind === "unknown" ? [m.text] : []));
}
