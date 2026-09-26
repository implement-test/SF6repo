import type { MoveCategory } from "./types";

/**
 * 커맨드 표 붙여넣기: 엑셀·구글 시트·웹 표에서 복사한 글을 기술 목록으로 바꾼다.
 * 칸은 탭으로 나뉜다 (없으면 쉼표). 첫 줄이 제목이면 열을 자동으로 맞춘다.
 */

export type ImportField =
  | "skip"
  | "category"
  | "name"
  | "input_classic"
  | "input_modern"
  | "damage"
  | "startup"
  | "active"
  | "recovery"
  | "on_hit"
  | "on_block"
  | "notes";

export const IMPORT_FIELDS: { value: ImportField; label: string }[] = [
  { value: "skip", label: "(쓰지 않음)" },
  { value: "category", label: "분류" },
  { value: "name", label: "이름" },
  { value: "input_classic", label: "커맨드 (클래식)" },
  { value: "input_modern", label: "커맨드 (모던)" },
  { value: "damage", label: "데미지" },
  { value: "startup", label: "발생" },
  { value: "active", label: "지속" },
  { value: "recovery", label: "경직" },
  { value: "on_hit", label: "히트" },
  { value: "on_block", label: "가드" },
  { value: "notes", label: "설명" },
];

/** 제목이 없을 때의 기본 열 순서 */
export const DEFAULT_COLUMNS: ImportField[] = [
  "name",
  "input_classic",
  "damage",
  "startup",
  "active",
  "recovery",
  "on_hit",
  "on_block",
];

/** 제목 글자 → 칸 (소문자·공백 제거 후 비교) */
const HEADER_WORDS: [ImportField, string[]][] = [
  ["category", ["분류", "종류", "category", "type"]],
  ["name", ["이름", "기술", "기술명", "name", "move", "movename", "技名"]],
  ["input_modern", ["모던", "모던커맨드", "modern", "modernInput", "モダン"]],
  ["input_classic", ["커맨드", "클래식", "입력", "command", "input", "classic", "notation", "コマンド"]],
  ["damage", ["데미지", "대미지", "damage", "dmg", "ダメージ"]],
  ["startup", ["발생", "startup", "start", "発生"]],
  ["active", ["지속", "active", "持続"]],
  ["recovery", ["경직", "후딜", "recovery", "硬直"]],
  ["on_hit", ["히트", "히트시", "onhit", "hit", "hitadv", "ヒット"]],
  ["on_block", ["가드", "가드시", "onblock", "block", "blockadv", "guard", "ガード"]],
  ["notes", ["설명", "메모", "비고", "notes", "note", "description", "備考"]],
];

const squash = (s: string) => s.toLowerCase().replace(/[\s_\-()（）.:]/g, "");

export function headerField(cell: string): ImportField | null {
  const key = squash(cell);
  if (!key) return null;
  for (const [field, words] of HEADER_WORDS) {
    if (words.some((w) => squash(w) === key)) return field;
  }
  return null;
}

/** 분류 글자 → 분류 (알 수 없으면 null) */
export function parseCategory(text: string): MoveCategory | null {
  const t = squash(text);
  if (!t) return null;
  if (/^(기본기|normal|normals|通常技)$/.test(t)) return "normal";
  if (/^(특수기|커맨드노멀|unique|commandnormal|commandnormals|特殊技)$/.test(t)) return "unique";
  if (/^(타겟콤보|타겟|targetcombo|targetcombos|tc|ターゲットコンボ)$/.test(t)) return "target_combo";
  if (/^(잡기|throw|throws|投げ)$/.test(t)) return "throw";
  if (/^(드라이브|드라이브시스템|drive|drivesystem|ドライブ)$/.test(t)) return "drive";
  if (/^(필살기|special|specials|specialmove|specialmoves|必殺技)$/.test(t)) return "special";
  if (/^(슈퍼아츠|슈퍼|초필살기|sa|sa1|sa2|sa3|super|superart|superarts|スーパーアーツ)$/.test(t)) return "super";
  return null;
}

/** 붙여 넣은 글 → 칸 나눈 줄들 (빈 줄은 뺀다) */
export function splitTable(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim());
  const useTab = lines.some((l) => l.includes("\t"));
  return lines.map((l) => (useTab ? l.split("\t") : l.split(",")).map((c) => c.trim()));
}

/** 첫 줄이 제목이면 그 열 배치를, 아니면 null */
export function detectHeader(row: string[]): ImportField[] | null {
  const fields = row.map((c) => headerField(c));
  const known = fields.filter((f) => f !== null).length;
  // 절반 이상이 제목 글자이고 이름이나 커맨드가 있으면 제목 줄로 본다
  if (known >= Math.max(2, Math.ceil(row.length / 2)) && (fields.includes("name") || fields.includes("input_classic"))) {
    return fields.map((f) => f ?? "skip");
  }
  return null;
}

export type ImportedMove = {
  category: MoveCategory | null;
  name: string;
  input_classic: string;
  input_modern: string | null;
  damage: string | null;
  startup: string | null;
  active: string | null;
  recovery: string | null;
  on_hit: string | null;
  on_block: string | null;
  notes: string | null;
};

/** 줄 하나를 열 배치대로 읽는다 */
export function readRow(row: string[], columns: ImportField[]): ImportedMove {
  const get = (field: ImportField) => {
    const i = columns.indexOf(field);
    const v = i >= 0 ? (row[i] ?? "").trim() : "";
    return v && v !== "-" && v !== "—" ? v : null;
  };
  return {
    category: parseCategory(get("category") ?? ""),
    name: get("name") ?? "",
    input_classic: get("input_classic") ?? "",
    input_modern: get("input_modern"),
    damage: get("damage"),
    startup: get("startup"),
    active: get("active"),
    recovery: get("recovery"),
    on_hit: get("on_hit"),
    on_block: get("on_block"),
    notes: get("notes"),
  };
}
