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
  type Setup,
  type SetupOption,
  type SetupVariant,
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
      label: b.result === "custom" ? (b.label ?? null) : null,
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

/** 셋업 하나 (0031) */
export function normalizeVariant(raw: unknown): SetupVariant {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<SetupVariant>;
  return {
    name: v.name ?? null,
    notation_classic: v.notation_classic ?? null,
    notation_modern: v.notation_modern ?? null,
    description: v.description ?? null,
    practice: normalizePractice(v.practice),
    options: normalizeOptions(v.options),
  };
}

/**
 * 포스트의 셋업 목록. variants 가 비어 있으면(0031 이전에 저장한 포스트) 예전 칼럼을 셋업 하나로 읽는다.
 */
export function setupVariants(
  s: Pick<Setup, "notation_classic" | "notation_modern" | "options" | "practice"> & { variants?: unknown },
): SetupVariant[] {
  if (Array.isArray(s.variants) && s.variants.length > 0) return s.variants.map(normalizeVariant);
  return [
    {
      name: null,
      notation_classic: s.notation_classic ?? null,
      notation_modern: s.notation_modern ?? null,
      description: null,
      practice: normalizePractice(s.practice),
      options: normalizeOptions(s.options),
    },
  ];
}

/** DB 에서 읽은 셋업 포스트를 현재 형식으로 (옵션 · 프랙티스 설정 · 셋업 목록) */
export function normalizeSetup<T extends Setup>(s: T): T & { variants: SetupVariant[] } {
  return {
    ...s,
    options: normalizeOptions(s.options),
    practice: normalizePractice(s.practice),
    variants: setupVariants(s),
  };
}

// ───────────────────────── 편집 창 (0031) ─────────────────────────

/** 편집 창의 셋업 하나: 이어지는 엔더(setup_enders)도 함께 들고 있다가 저장할 때 나눈다 */
export type EditVariant = SetupVariant & { ender_ids: number[] };

/** 새 옵션: 히트 · 가드 분기 두 줄 */
export const emptyOption = (n: number): SetupOption => ({
  label: `옵션 ${n}`,
  classic: "",
  modern: null,
  description: null,
  branches: (["hit", "guard"] as const).map((result) => ({ result, label: null, classic: "", modern: null, note: null })),
  youtube_url: null,
});

/** 새 셋업 (옵션 2개) */
export const emptyVariant = (): EditVariant => ({
  name: null,
  notation_classic: null,
  notation_modern: null,
  description: null,
  practice: null,
  options: [emptyOption(1), emptyOption(2)],
  ender_ids: [],
});

/** 셋업 ↔ 엔더 연결 하나 (setup_enders 의 ender_id · variant) */
export type VariantLink = { ender_id: number; variant: number };

/** 연결 목록 (예전 임시 내용은 엔더 id 목록 = 모두 첫 번째 셋업) */
export function normalizeVariantLinks(raw: unknown): VariantLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((v): VariantLink[] => {
    if (typeof v === "number") return [{ ender_id: v, variant: 0 }];
    if (v && typeof v === "object" && typeof (v as VariantLink).ender_id === "number") {
      const variant = (v as VariantLink).variant;
      return [{ ender_id: (v as VariantLink).ender_id, variant: typeof variant === "number" ? variant : 0 }];
    }
    return [];
  });
}

/**
 * 편집 창에 넣을 셋업 목록: variants(없으면 예전 칼럼) + 셋업마다의 엔더.
 * ender_links 가 있으면(DB 에서 불러올 때 · 과거 버전을 불러올 때) 그것으로 엔더를 나눠 준다.
 */
export function editableVariants(row: Record<string, unknown>): EditVariant[] {
  const source = row as Parameters<typeof setupVariants>[0];
  const previous = Array.isArray(row.variants) ? (row.variants as Partial<EditVariant>[]) : [];
  const links = "ender_links" in row ? normalizeVariantLinks(row.ender_links) : null;
  const variants = setupVariants(source);
  return variants.map((v, i) => ({
    ...v,
    ender_ids: links
      ? links.filter((l) => l.variant === i || (l.variant >= variants.length && i === variants.length - 1)).map((l) => l.ender_id)
      : (previous[i]?.ender_ids ?? []).filter((id): id is number => typeof id === "number"),
  }));
}

/** 저장할 연결: 셋업 순서대로, 같은 엔더는 앞의 셋업 하나에만 */
export function variantLinks(variants: Pick<EditVariant, "ender_ids">[]): VariantLink[] {
  const seen = new Set<number>();
  return variants.flatMap((v, variant) =>
    v.ender_ids.flatMap((ender_id) => {
      if (seen.has(ender_id)) return [];
      seen.add(ender_id);
      return [{ ender_id, variant }];
    }),
  );
}
