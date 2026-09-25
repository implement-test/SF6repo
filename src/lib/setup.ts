import {
  DRIVE_REVERSAL_OPTIONS,
  GUARD_SETTINGS,
  GUARD_SWITCHES,
  type DriveReversalOption,
  type DriveReversalWeights,
  type GuardSetting,
  type Localized,
  type OptionBranch,
  type PracticeConfig,
  type PracticeRow,
  type SetupOption,
} from "./types";

/**
 * 셋업 데이터를 현재 형식으로 맞춘다.
 * 초기 형식(리버설 슬롯이 콤보 표기 문자열, 가드 설정·재생 방식 칸)으로 저장된 값도 읽을 수 있게 한다.
 */

type LegacyPractice = {
  guard_setting?: unknown;
  guard_switch?: unknown;
  drive_reversal?: unknown;
  wakeup?: unknown;
  guard?: unknown;
  after_guard?: { count?: number | null; slots?: string[] };
  after_hit?: unknown;
  notes?: Localized | null;
};

function toRows(value: unknown, count?: number | null): PracticeRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) =>
    typeof row === "string"
      ? { command: { ko: row }, delay: null, ...(count !== undefined ? { count } : {}) }
      : {
          command: (row as PracticeRow).command ?? { ko: "" },
          delay: (row as PracticeRow).delay ?? null,
          ...(count !== undefined || "count" in (row as object) ? { count: (row as PracticeRow).count ?? count ?? null } : {}),
        },
  );
}

/** 초기 형식의 guard 문자열 설정을 지금의 가드 설정으로 */
const LEGACY_GUARD: Record<string, GuardSetting> = { all: "all", none: "none", random: "random", after_first: "count" };

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

const clampWeight = (v: unknown) => Math.min(10, Math.max(0, Math.round(Number(v) || 0)));

/** 이전 형식(선택 하나)은 그 항목만 10 인 확률로 바꾼다. 랜덤은 모두 5 */
const LEGACY_DRIVE: Record<string, DriveReversalWeights> = {
  off: { off: 10, guard: 0, wakeup: 0 },
  guard: { off: 0, guard: 10, wakeup: 0 },
  wakeup: { off: 0, guard: 0, wakeup: 10 },
  random: { off: 5, guard: 5, wakeup: 5 },
};

export function normalizeDriveReversal(value: unknown): DriveReversalWeights | null {
  if (typeof value === "string") return LEGACY_DRIVE[value] ?? null;
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<Record<DriveReversalOption, unknown>>;
  return Object.fromEntries(DRIVE_REVERSAL_OPTIONS.map((k) => [k, clampWeight(v[k])])) as DriveReversalWeights;
}

export function normalizePractice(raw: unknown): PracticeConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as LegacyPractice;
  const legacyGuard = p.after_guard ? toRows(p.after_guard.slots ?? [], p.after_guard.count ?? null) : [];
  return {
    guard_setting:
      oneOf(p.guard_setting, GUARD_SETTINGS) ?? (typeof p.guard === "string" ? (LEGACY_GUARD[p.guard] ?? null) : null),
    guard_switch: oneOf(p.guard_switch, GUARD_SWITCHES),
    drive_reversal: normalizeDriveReversal(p.drive_reversal),
    wakeup: toRows(p.wakeup),
    // 초기 형식에서 guard 는 '전부 가드' 같은 문자열 설정이었다
    guard: Array.isArray(p.guard) ? toRows(p.guard, null) : legacyGuard,
    after_hit: toRows(p.after_hit),
    notes: p.notes ?? null,
  };
}

export function normalizeOptions(raw: unknown): SetupOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o: Partial<SetupOption>, i) => ({
    label: o.label ?? `옵션 ${i + 1}`,
    classic: o.classic ?? "",
    modern: o.modern ?? null,
    description: o.description ?? null,
    branches: (o.branches ?? []).map((b: Partial<OptionBranch>) => ({
      result: b.result ?? "hit",
      classic: b.classic ?? "",
      modern: b.modern ?? null,
      note: b.note ?? null,
    })),
    youtube_url: o.youtube_url ?? null,
    youtube_start: o.youtube_start ?? null,
    youtube_end: o.youtube_end ?? null,
    youtube_loop: !!o.youtube_loop,
  }));
}
