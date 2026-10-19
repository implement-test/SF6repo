"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  DRIVE_REVERSAL_OPTIONS,
  GUARD_SETTINGS,
  GUARD_SWITCHES,
  MOVE_CATEGORIES,
  OPTION_RESULTS,
  type DriveReversalWeights,
  type GuardSetting,
  type GuardSwitch,
  type Localized,
  type OptionBranch,
  type OptionResult,
  type PracticeConfig,
  type PracticeRow,
  type SetupOption,
  type SetupSituation,
  type ComboEnder,
  type Move,
  type MoveCategory,
} from "@/lib/types";
import { normalizeDriveReversal } from "@/lib/setup";
import { NotationImage } from "../notation";
import { inputClass, NotationRow } from "./starters-input";
import { ClockInput } from "./clock-input";

const RESULT_LABELS: Record<OptionResult, string> = { hit: "히트", guard: "가드", whiff: "헛침", other: "기타", custom: "조건 (직접 입력)" };

const iconButton =
  "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

function Heading({ label, help }: { label: string; help?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
    >
      <span>{children}</span>
    </button>
  );
}

// ───────────────────────── 상황 태그 ─────────────────────────

export function SituationsInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [options, setOptions] = useState<SetupSituation[]>([]);
  useEffect(() => {
    supabaseBrowser()
      .from("setup_situations")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setOptions(data ?? []));
  }, []);
  return (
    <div className="flex flex-col gap-1.5">
      <Heading label={label} />
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = value.includes(o.slug);
          return (
            <Chip key={o.slug} on={on} onClick={() => onChange(on ? value.filter((v) => v !== o.slug) : [...value, o.slug])}>
              {o.name.ko}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── 이어지는 엔더 ─────────────────────────

/** 저장된 값(엔더 id 목록)을 읽는다. 예전 형식(콤보 연결)은 버린다 — 0025 에서 엔더 연결로 옮겼다 */
export function normalizeEnderLinks(raw: unknown): number[] {
  return Array.isArray(raw) ? raw.filter((v): v is number => typeof v === "number") : [];
}

/**
 * 이 셋업으로 이어지는 엔더 고르기. 엔더로 끝나는 콤보(루트 · 마무리)에는 이 셋업이 자동으로 붙는다.
 * 엔더 목록은 콤보 탭의 '엔더 관리'에서 만든다.
 */
export function EnderLinksInput({
  label,
  help,
  characterId,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  characterId?: number;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const [enders, setEnders] = useState<ComboEnder[] | null>(null);

  useEffect(() => {
    if (characterId === undefined) return;
    supabaseBrowser()
      .from("combo_enders")
      .select("*")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data }) => setEnders((data ?? []) as ComboEnder[]));
  }, [characterId]);

  return (
    <div className="flex flex-col gap-2">
      <Heading label={label} help={help} />
      {enders === null ? (
        <p className="text-xs text-muted">불러오는 중…</p>
      ) : enders.length === 0 ? (
        <p className="text-xs text-muted">아직 엔더가 없습니다. 콤보 탭의 “엔더 관리”에서 만드세요.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {enders.map((e) => {
            const on = value.includes(e.id);
            return (
              <li key={e.id}>
                <label
                  className={`flex cursor-pointer items-center gap-2.5 border px-2.5 py-2 transition-colors ${on ? "border-accent bg-accent/10" : "border-border bg-surface-2 hover:border-border-strong"}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onChange(on ? value.filter((id) => id !== e.id) : [...value, e.id])}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <NotationImage notation={e.notation_classic} />
                      {e.label && <span className="text-xs font-semibold">{e.label.ko}</span>}
                    </span>
                    {e.frame_after && <span className="text-xs text-muted">후상황 {e.frame_after}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ───────────────────────── 플레이 팁: 연결할 커맨드 리스트 기술 ─────────────────────────

/**
 * 플레이 팁에 붙일 이 캐릭터의 기술 (move_ids). 고른 순서대로 카드의 프레임 표에 나온다.
 * 기술이 많아 분류별로 묶고 이름 · 커맨드로 거를 수 있게 한다.
 */
export function MoveLinksInput({
  label,
  help,
  characterId,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  characterId?: number;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const [moves, setMoves] = useState<Move[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (characterId === undefined) return;
    supabaseBrowser()
      .from("moves")
      .select("*")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data }) => setMoves((data ?? []) as Move[]));
  }, [characterId]);

  const q = query.trim().toLowerCase();
  const match = (m: Move) =>
    !q || [m.name.ko, m.name.en, m.name.ja, m.input_classic, m.input_modern].some((t) => t?.toLowerCase().includes(q));
  const byId = new Map((moves ?? []).map((m) => [m.id, m]));
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="flex flex-col gap-2">
      <Heading label={label} help={help} />
      {/* 고른 기술 (이 순서로 카드에 나온다) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const m = byId.get(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                title="빼기"
                className="flex items-center gap-1.5 border border-accent bg-accent/10 px-2 py-1 text-xs font-semibold"
              >
                {m ? `${m.name.ko} · ${m.input_classic}` : `#${id} (지워진 기술)`}
                <span aria-hidden className="text-muted">×</span>
              </button>
            );
          })}
        </div>
      )}
      {moves === null ? (
        <p className="text-xs text-muted">불러오는 중…</p>
      ) : moves.length === 0 ? (
        <p className="text-xs text-muted">아직 커맨드 리스트가 없습니다.</p>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기술 이름 · 커맨드로 찾기 (예: 2MK, 대공)"
            className={inputClass}
          />
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto border border-border p-2">
            {MOVE_CATEGORIES.map((cat) => {
              const list = moves.filter((m) => m.category === cat && match(m));
              if (list.length === 0) return null;
              return (
                <div key={cat} className="flex flex-col gap-1">
                  <span className="text-[0.7rem] font-bold text-muted">{MOVE_CATEGORY_LABELS[cat]}</span>
                  <div className="flex flex-wrap gap-1">
                    {list.map((m) => (
                      <Chip key={m.id} on={value.includes(m.id)} onClick={() => toggle(m.id)}>
                        {m.name.ko} <span className="font-mono text-[0.7rem] opacity-70">{m.input_classic}</span>
                        {!m.is_published && <span className="text-[0.65rem] text-accent"> 비공개</span>}
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const MOVE_CATEGORY_LABELS: Record<MoveCategory, string> = {
  normal: "기본기",
  unique: "특수기",
  target_combo: "타겟 콤보",
  throw: "잡기",
  drive: "드라이브 시스템",
  special: "필살기",
  super: "슈퍼 아츠",
};

// ───────────────────────── 다국어 한 줄 입력 ─────────────────────────

const LANGS = ["ko", "en", "ja"] as const;

/**
 * 한국어 입력칸 하나 + 필요할 때 펼치는 영어·일본어 칸.
 * multiline 이면 줄바꿈(Enter / Shift+Enter)을 그대로 저장하고, 내용에 맞춰 높이가 늘어난다.
 */
function LocalizedLine({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: Localized | null;
  onChange: (v: Localized | null) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const [open, setOpen] = useState(!!(value?.en || value?.ja));
  const set = (lang: (typeof LANGS)[number], text: string) =>
    onChange({ ...(value ?? { ko: "" }), [lang]: text } as Localized);
  const field = (lang: (typeof LANGS)[number], ph: string) =>
    multiline ? (
      <textarea
        rows={1}
        value={value?.[lang] ?? ""}
        onChange={(e) => set(lang, e.target.value)}
        placeholder={ph}
        className={`${inputClass} field-sizing-content resize-y`}
      />
    ) : (
      <input value={value?.[lang] ?? ""} onChange={(e) => set(lang, e.target.value)} placeholder={ph} className={inputClass} />
    );
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-start gap-1">
        {field("ko", placeholder)}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-pressed={open}
          title="영어 / 일본어"
          className="shrink-0 border border-border-strong px-1.5 text-[0.65rem] font-bold text-muted hover:text-fg aria-pressed:border-accent aria-pressed:text-accent"
        >
          EN/JA
        </button>
      </div>
      {open &&
        (["en", "ja"] as const).map((lang) => (
          <div key={lang} className="flex items-start gap-1">
            <span className="w-6 pt-1.5 text-[0.65rem] font-bold uppercase text-muted">{lang}</span>
            {field(lang, "(선택)")}
          </div>
        ))}
    </div>
  );
}

function RowButtons({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(-1)} aria-label="위로">
        ↑
      </button>
      <button type="button" className={iconButton} disabled={index === length - 1} onClick={() => onMove(1)} aria-label="아래로">
        ↓
      </button>
      <button type="button" className={`${iconButton} hover:border-warn hover:text-warn`} onClick={onRemove} aria-label="삭제">
        ×
      </button>
    </span>
  );
}

function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const next = [...list];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
}

const addButton =
  "self-start border border-dashed border-border-strong px-2.5 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-accent";

// ───────────────────────── 옵션 1/2/... ─────────────────────────

const nextLabel = (list: SetupOption[]) => `옵션 ${list.length + 1}`;
const emptyBranch = (result: OptionResult = "hit"): OptionBranch => ({ result, label: null, classic: "", modern: null, note: null });

export function OptionsInput({ value, onChange }: { value: SetupOption[]; onChange: (v: SetupOption[]) => void }) {
  const update = (i: number, patch: Partial<SetupOption>) => onChange(value.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        행동과 루트는 콤보 표기로 적습니다. 글자가 필요하면 괄호로 적으세요: <code>(약간 끌어서) 5HP</code>
      </p>
      {value.map((o, i) => (
        <div key={i} className="flex flex-col gap-2 border border-border bg-surface-2 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">이름</span>
            <input
              value={o.label}
              onChange={(e) => update(i, { label: e.target.value })}
              className={`${inputClass} w-40! font-bold`}
              aria-label="옵션 이름"
            />
            <span className="ml-auto">
              <RowButtons
                index={i}
                length={value.length}
                onMove={(dir) => onChange(moveItem(value, i, dir))}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
              />
            </span>
          </div>

          <NotationRow label="행동" value={o.classic} onChange={(classic) => update(i, { classic })} placeholder="예: (약간 끌어서) 5HP" />
          <NotationRow label="모던" value={o.modern ?? ""} onChange={(modern) => update(i, { modern })} placeholder="비우면 클래식 전용" />
          <div className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
            <span className="pt-1.5 text-xs font-bold text-muted">설명</span>
            <LocalizedLine
              multiline
              value={o.description}
              onChange={(description) => update(i, { description })}
              placeholder="예: HP가 2히트 되는 거리에서 써야 됨"
            />
          </div>

          {/* 결과별 분기 */}
          <div className="flex flex-col gap-2 border-t border-border pt-2">
            <span className="text-xs font-semibold text-muted">결과별 루트</span>
            {o.branches.map((b, j) => {
              const setBranch = (patch: Partial<OptionBranch>) =>
                update(i, { branches: o.branches.map((x, k) => (k === j ? { ...x, ...patch } : x)) });
              return (
                <div key={j} className="flex flex-col gap-1.5 border border-border bg-surface p-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={b.result}
                      onChange={(e) => setBranch({ result: e.target.value as OptionResult })}
                      className={`${inputClass} w-36!`}
                      aria-label="결과"
                    >
                      {OPTION_RESULTS.map((r) => (
                        <option key={r} value={r}>
                          {RESULT_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <span className="ml-auto">
                      <RowButtons
                        index={j}
                        length={o.branches.length}
                        onMove={(dir) => update(i, { branches: moveItem(o.branches, j, dir) })}
                        onRemove={() => update(i, { branches: o.branches.filter((_, k) => k !== j) })}
                      />
                    </span>
                  </div>
                  {/* 조건(직접 입력): 카드에 결과 대신 이 조건 이름이 보인다 */}
                  {b.result === "custom" && (
                    <div className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
                      <span className="pt-1.5 text-xs font-bold text-accent">조건</span>
                      <LocalizedLine value={b.label ?? null} onChange={(label) => setBranch({ label })} placeholder="예: 상대가 점프하면" />
                    </div>
                  )}
                  <NotationRow label="루트" value={b.classic} onChange={(classic) => setBranch({ classic })} placeholder="예: 5HP(2) → 2MP" />
                  <NotationRow label="모던" value={b.modern ?? ""} onChange={(modern) => setBranch({ modern })} placeholder="비우면 클래식 전용" />
                  <div className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
                    <span className="pt-1.5 text-xs font-bold text-muted">메모</span>
                    <LocalizedLine multiline value={b.note} onChange={(note) => setBranch({ note })} placeholder="예: HP가 1타만 맞아도 이어짐" />
                  </div>
                </div>
              );
            })}
            <div className="flex gap-1">
              {OPTION_RESULTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update(i, { branches: [...o.branches, emptyBranch(r)] })}
                  className={addButton}
                >
                  + {RESULT_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
            <span className="pt-1.5 text-xs font-bold text-muted">영상</span>
            <div className="flex flex-col gap-1.5">
              <input
                type="url"
                value={o.youtube_url ?? ""}
                onChange={(e) => update(i, { youtube_url: e.target.value })}
                placeholder="YouTube URL (선택)"
                className={inputClass}
              />
              {o.youtube_url?.trim() && (
                <div className="flex flex-wrap items-start gap-2 text-xs text-muted">
                  <span className="pt-1.5">구간</span>
                  <ClockInput
                    value={o.youtube_start ?? null}
                    onChange={(youtube_start) => update(i, { youtube_start })}
                    placeholder="시작 1:23"
                    className="w-24!"
                  />
                  <span className="pt-1.5">~</span>
                  <ClockInput
                    value={o.youtube_end ?? null}
                    onChange={(youtube_end) => update(i, { youtube_end })}
                    placeholder="끝 1:30"
                    className="w-24!"
                  />
                  <label className="flex items-center gap-1.5 pt-1.5 font-semibold">
                    <input
                      type="checkbox"
                      checked={!!o.youtube_loop}
                      onChange={(e) => update(i, { youtube_loop: e.target.checked })}
                      className="size-4 accent-[var(--accent)]"
                    />
                    구간 반복
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...value,
            { label: nextLabel(value), classic: "", modern: null, description: null, branches: [emptyBranch("hit"), emptyBranch("guard")], youtube_url: null },
          ])
        }
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 옵션 추가
      </button>
    </div>
  );
}

// ───────────────────────── 프랙티스 설정 ─────────────────────────

export const emptyPractice = (): PracticeConfig => ({
  guard_setting: null,
  guard_switch: null,
  drive_reversal: null,
  wakeup: [],
  guard: [],
  after_hit: [],
  notes: null,
});

const GUARD_SETTING_LABELS: Record<GuardSetting, string> = {
  random: "랜덤",
  none: "가드하지 않음",
  all: "전부 가드",
  count: "카운트 가드",
};
const GUARD_SWITCH_LABELS: Record<GuardSwitch, string> = {
  on: "실행",
  stand: "서서 가드만",
  crouch: "앉아 가드만",
  random: "랜덤",
};
const DRIVE_REVERSAL_LABELS = { off: "실행하지 않음", guard: "가드 발동", wakeup: "일어서기 발동" } as const;

/** 드라이브 리버설(랜덤): 항목별 확률 0~10. 비우면 지정 안 함 */
function DriveReversalInput({
  value,
  onChange,
}: {
  value: DriveReversalWeights | null;
  onChange: (v: DriveReversalWeights | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 border border-border bg-surface p-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted">드라이브 리버설(랜덤)</span>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="ml-auto text-[0.7rem] font-semibold text-muted hover:text-warn">
            빼기
          </button>
        )}
      </div>
      <span className="text-[0.7rem] text-muted">Y 버튼을 누르면 확률을 수정할 수 있습니다.</span>
      {value ? (
        DRIVE_REVERSAL_OPTIONS.map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{DRIVE_REVERSAL_LABELS[k]}</span>
            <input
              type="number"
              min={0}
              max={10}
              step={1}
              value={value[k]}
              onChange={(e) => onChange({ ...value, [k]: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })}
              className={`${inputClass} w-16! text-center`}
            />
          </label>
        ))
      ) : (
        <button
          type="button"
          onClick={() => onChange({ off: 0, guard: 0, wakeup: 0 })}
          className="self-start border border-dashed border-border-strong px-2.5 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-accent"
        >
          + 설정
        </button>
      )}
    </div>
  );
}

/** 더미 설정 선택 상자 (비우면 지정 안 함) */
function DummySelect<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (v: T | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange((e.target.value || null) as T | null)} className={inputClass}>
        <option value="">— (지정 안 함)</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PracticeInput({ value, onChange }: { value: PracticeConfig | null; onChange: (v: PracticeConfig | null) => void }) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() => onChange(emptyPractice())}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 프랙티스 설정 넣기
      </button>
    );
  }
  const set = (patch: Partial<PracticeConfig>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3 border border-border bg-surface-2 p-3">
      <div className="flex items-center">
        <p className="text-xs text-muted">더미는 아무 캐릭터로 하므로 커맨드는 글자로 적습니다. 딜레이는 프레임.</p>
        <button type="button" onClick={() => onChange(null)} className="ml-auto text-xs font-semibold text-muted hover:text-warn">
          프랙티스 설정 빼기
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <DummySelect
          label="가드"
          value={value.guard_setting}
          options={GUARD_SETTINGS}
          labels={GUARD_SETTING_LABELS}
          onChange={(guard_setting) => set({ guard_setting })}
        />
        <DummySelect
          label="가드 전환"
          value={value.guard_switch}
          options={GUARD_SWITCHES}
          labels={GUARD_SWITCH_LABELS}
          onChange={(guard_switch) => set({ guard_switch })}
        />
        <DriveReversalInput value={value.drive_reversal} onChange={(drive_reversal) => set({ drive_reversal })} />
      </div>
      <RowList label="다운 리버설" rows={value.wakeup} onChange={(wakeup) => set({ wakeup })} />
      <RowList label="가드 리버설" rows={value.guard} onChange={(guard) => set({ guard })} withCount />
      <RowList label="데미지 복귀 리버설" rows={value.after_hit} onChange={(after_hit) => set({ after_hit })} />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">메모</span>
        <LocalizedLine multiline value={value.notes} onChange={(notes) => set({ notes })} placeholder="예: 더미 위치 코너" />
      </div>
    </div>
  );
}

/** 리버설 표 한 개: 커맨드(글자) · (카운트) · 딜레이 */
function RowList({
  label,
  rows,
  onChange,
  withCount = false,
}: {
  label: string;
  rows: PracticeRow[];
  onChange: (v: PracticeRow[]) => void;
  withCount?: boolean;
}) {
  const setRow = (i: number, patch: Partial<PracticeRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {rows.length > 0 && (
        <div className="flex items-center gap-2 text-[0.65rem] font-bold text-muted">
          <span className="flex-1">커맨드</span>
          {withCount && <span className="w-16 text-center">카운트</span>}
          <span className="w-16 text-center">딜레이</span>
          <span className="w-[5.5rem]" />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <LocalizedLine value={row.command} onChange={(command) => setRow(i, { command: command ?? { ko: "" } })} placeholder="예: 4F 기본기 / 뒤로 걷기 (녹화)" />
          {withCount && (
            <input
              type="number"
              min={0}
              value={row.count ?? ""}
              onChange={(e) => setRow(i, { count: num(e.target.value) })}
              className={`${inputClass} w-16! text-center`}
              aria-label="카운트"
            />
          )}
          <input
            type="number"
            min={0}
            value={row.delay ?? ""}
            onChange={(e) => setRow(i, { delay: num(e.target.value) })}
            className={`${inputClass} w-16! text-center`}
            aria-label="딜레이"
          />
          <RowButtons
            index={i}
            length={rows.length}
            onMove={(dir) => onChange(moveItem(rows, i, dir))}
            onRemove={() => onChange(rows.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, withCount ? { command: { ko: "" }, count: 0, delay: 0 } : { command: { ko: "" }, delay: 0 }])}
        className={addButton}
      >
        + 행 추가
      </button>
    </div>
  );
}

// ───────────────────────── 저장 전 정리 ─────────────────────────

function cleanLocalized(v: Localized | null | undefined): Localized | null {
  if (!v) return null;
  const out: Partial<Localized> = {};
  for (const l of LANGS) {
    const t = v[l]?.trim();
    if (t) out[l] = t;
  }
  return out.ko ? (out as Localized) : null;
}

export function cleanOptions(list: SetupOption[] | null | undefined): SetupOption[] {
  return (list ?? [])
    .map((o, i) => ({
      label: o.label.trim() || `옵션 ${i + 1}`,
      classic: o.classic.trim(),
      modern: o.modern?.trim() || null,
      description: cleanLocalized(o.description),
      branches: (o.branches ?? [])
        .map((b) => ({
          result: b.result,
          label: b.result === "custom" ? cleanLocalized(b.label) : null,
          classic: b.classic.trim(),
          modern: b.modern?.trim() || null,
          note: cleanLocalized(b.note),
        }))
        .filter((b) => b.classic || b.note || b.label),
      youtube_url: o.youtube_url?.trim() || null,
      youtube_start: o.youtube_url?.trim() ? (o.youtube_start ?? null) : null,
      youtube_end: o.youtube_url?.trim() && o.youtube_end && o.youtube_end > (o.youtube_start ?? 0) ? o.youtube_end : null,
      youtube_loop: !!(o.youtube_url?.trim() && o.youtube_loop && o.youtube_end),
    }))
    .filter((o) => o.classic || o.description || o.branches.length > 0);
}

export function cleanPractice(p: PracticeConfig | null | undefined): PracticeConfig | null {
  if (!p) return null;
  const rows = (list: PracticeRow[], withCount: boolean) =>
    list
      .map((r) => {
        const command = cleanLocalized(r.command);
        if (!command) return null;
        return withCount ? { command, count: r.count ?? null, delay: r.delay ?? null } : { command, delay: r.delay ?? null };
      })
      .filter((r): r is PracticeRow => r !== null);
  return {
    guard_setting: p.guard_setting ?? null,
    guard_switch: p.guard_switch ?? null,
    drive_reversal: normalizeDriveReversal(p.drive_reversal),
    wakeup: rows(p.wakeup, false),
    guard: rows(p.guard, true),
    after_hit: rows(p.after_hit, false),
    notes: cleanLocalized(p.notes),
  };
}