import type { Localized, OptionBranch, PracticeConfig, PracticeRow, SetupOption } from "./types";

/**
 * 셋업 데이터를 현재 형식으로 맞춘다.
 * 초기 형식(리버설 슬롯이 콤보 표기 문자열, 가드 설정·재생 방식 칸)으로 저장된 값도 읽을 수 있게 한다.
 */

type LegacyPractice = {
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

export function normalizePractice(raw: unknown): PracticeConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as LegacyPractice;
  const legacyGuard = p.after_guard ? toRows(p.after_guard.slots ?? [], p.after_guard.count ?? null) : [];
  return {
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
  }));
}
