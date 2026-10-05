"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { normalizeNotation } from "@/lib/notation/parse";
import {
  DRIVE_REVERSAL_OPTIONS,
  GUARD_SETTINGS,
  GUARD_SWITCHES,
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
  type ComboFinish,
  type ComboLinkTarget,
  type ComboRoute,
} from "@/lib/types";
import { normalizeDriveReversal } from "@/lib/setup";
import { comboRoutes } from "@/lib/combo-routes";
import { NotationImage } from "../notation";
import { inputClass, NotationRow } from "./starters-input";
import { ClockInput } from "./clock-input";

const RESULT_LABELS: Record<OptionResult, string> = { hit: "히트", guard: "가드", whiff: "헛침", other: "기타" };

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

// ───────────────────────── 연결 콤보 ─────────────────────────

type ComboRow = {
  id: number;
  title: { ko: string } | null;
  notation_classic: string;
  notation_modern: string | null;
  damage: number | null;
  frame_after: string | null;
  extra_routes: unknown;
  finishes: unknown;
  route_note: unknown;
  is_published: boolean;
};

/** 예전 형식(콤보 id 목록)도 루트 1 · 마무리 없음 연결로 읽는다 */
export function normalizeComboLinks(raw: unknown): ComboLinkTarget[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((v): ComboLinkTarget[] => {
    if (typeof v === "number") return [{ combo_id: v, route_index: 0, finish_index: null }];
    if (v && typeof v === "object" && typeof (v as ComboLinkTarget).combo_id === "number") {
      const t = v as ComboLinkTarget;
      return [{ combo_id: t.combo_id, route_index: t.route_index ?? 0, finish_index: t.finish_index ?? null }];
    }
    return [];
  });
}

const sameTarget = (a: ComboLinkTarget, b: ComboLinkTarget) =>
  a.combo_id === b.combo_id && a.route_index === b.route_index && a.finish_index === b.finish_index;

const routeLabel = (r: ComboRoute, i: number) => `루트 ${i + 1}: ${normalizeNotation(r.classic)}`;
const finishLabel = (f: ComboFinish, i: number) => `마무리 ${i + 1}: ${normalizeNotation(f.classic)}`;

/**
 * 이 셋업으로 이어지는 콤보의 루트(마무리) 고르기.
 * 콤보 → 루트 → (마무리가 있으면) 마무리 순으로 드롭다운을 골라 추가하고, 순서를 바꾸거나 뺀다.
 */
export function ComboLinksInput({
  label,
  help,
  characterId,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  characterId?: number;
  value: ComboLinkTarget[];
  onChange: (v: ComboLinkTarget[]) => void;
}) {
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [draft, setDraft] = useState<{ combo: number | null; route: number | null; finish: number | null }>({
    combo: null,
    route: null,
    finish: null,
  });

  useEffect(() => {
    if (characterId === undefined) return;
    supabaseBrowser()
      .from("combos")
      .select("id,title,notation_classic,notation_modern,damage,frame_after,extra_routes,finishes,route_note,is_published")
      .eq("character_id", characterId)
      .order("sort_order")
      .then(({ data }) => setCombos((data ?? []) as ComboRow[]));
  }, [characterId]);

  const byId = useMemo(() => new Map(combos.map((c) => [c.id, c])), [combos]);
  const routesOf = (id: number | null) => {
    const c = id === null ? undefined : byId.get(id);
    return c ? comboRoutes(c) : [];
  };

  const draftRoutes = routesOf(draft.combo);
  const draftFinishes = draft.route === null ? [] : (draftRoutes[draft.route]?.finishes ?? []);
  const draftTarget: ComboLinkTarget | null =
    draft.combo !== null && draft.route !== null
      ? { combo_id: draft.combo, route_index: draft.route, finish_index: draft.finish }
      : null;
  const duplicate = !!draftTarget && value.some((v) => sameTarget(v, draftTarget));

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const update = (i: number, patch: Partial<ComboLinkTarget>) =>
    onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="flex flex-col gap-2">
      <Heading label={label} help={help} />
      {value.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {value.map((link, i) => {
            const c = byId.get(link.combo_id);
            const routes = routesOf(link.combo_id);
            const route = routes[link.route_index];
            const finish = link.finish_index === null ? null : (route?.finishes[link.finish_index] ?? null);
            const frameAfter = finish ? finish.frame_after : route?.frame_after;
            return (
              <li key={i} className="flex items-start gap-2 border border-border bg-surface-2 p-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-xs font-semibold">
                    {c?.title?.ko ?? `콤보 #${link.combo_id}`}
                    {c && !c.is_published && <span className="ml-1 text-warn">(비공개)</span>}
                  </span>
                  {c && (
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      <select
                        value={link.route_index}
                        onChange={(e) => update(i, { route_index: Number(e.target.value), finish_index: null })}
                        className={inputClass}
                        aria-label="루트"
                      >
                        {routes.map((r, ri) => (
                          <option key={ri} value={ri}>
                            {routeLabel(r, ri)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={link.finish_index ?? ""}
                        disabled={!route || route.finishes.length === 0}
                        onChange={(e) => update(i, { finish_index: e.target.value === "" ? null : Number(e.target.value) })}
                        className={`${inputClass} disabled:opacity-40`}
                        aria-label="마무리"
                      >
                        <option value="">{route && route.finishes.length > 0 ? "마무리 선택 안 함" : "마무리 없음"}</option>
                        {route?.finishes.map((f, fi) => (
                          <option key={fi} value={fi}>
                            {finishLabel(f, fi)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {route && (
                    <div className="flex flex-wrap items-center gap-2">
                      <NotationImage notation={route.classic} />
                      {finish && (
                        <>
                          <span className="notation-finish">FINISH</span>
                          <NotationImage notation={finish.classic} />
                        </>
                      )}
                    </div>
                  )}
                  {c && !route && <span className="text-xs text-warn">이 루트가 콤보에서 없어졌습니다. 다시 고르세요.</span>}
                  {route && <span className="text-xs text-muted">콤보 후 프레임 {frameAfter ?? "미입력"}</span>}
                </div>
                <span className="flex gap-1">
                  <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로">
                    ↑
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    disabled={i === value.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="아래로"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} hover:border-warn hover:text-warn`}
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                    aria-label="빼기"
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* 추가: 콤보 → 루트 → (있으면) 마무리 */}
      <div className="grid gap-1.5 border border-dashed border-border-strong p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <select
          value={draft.combo ?? ""}
          onChange={(e) => {
            const combo = e.target.value ? Number(e.target.value) : null;
            const routes = routesOf(combo);
            // 루트가 하나뿐이면 바로 고른다
            setDraft({ combo, route: routes.length === 1 ? 0 : null, finish: null });
          }}
          className={inputClass}
          aria-label="콤보"
        >
          <option value="">콤보 선택</option>
          {combos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title?.ko ?? `콤보 #${c.id}`}
              {!c.is_published ? " (비공개)" : ""}
            </option>
          ))}
        </select>
        <select
          value={draft.route ?? ""}
          disabled={draft.combo === null}
          onChange={(e) => setDraft({ ...draft, route: e.target.value === "" ? null : Number(e.target.value), finish: null })}
          className={`${inputClass} disabled:opacity-40`}
          aria-label="루트"
        >
          <option value="">루트 선택</option>
          {draftRoutes.map((r, ri) => (
            <option key={ri} value={ri}>
              {routeLabel(r, ri)}
            </option>
          ))}
        </select>
        <select
          value={draft.finish ?? ""}
          disabled={draftFinishes.length === 0}
          onChange={(e) => setDraft({ ...draft, finish: e.target.value === "" ? null : Number(e.target.value) })}
          className={`${inputClass} disabled:opacity-40`}
          aria-label="마무리"
        >
          <option value="">{draftFinishes.length > 0 ? "마무리 선택" : "마무리 없음"}</option>
          {draftFinishes.map((f, fi) => (
            <option key={fi} value={fi}>
              {finishLabel(f, fi)}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!draftTarget || duplicate}
          onClick={() => {
            if (!draftTarget) return;
            onChange([...value, draftTarget]);
            setDraft({ combo: null, route: null, finish: null });
          }}
          className="border border-accent px-3 py-1.5 text-sm font-bold text-accent hover:bg-accent hover:text-accent-fg disabled:opacity-40"
        >
          {duplicate ? "이미 있음" : "추가"}
        </button>
      </div>
    </div>
  );
}

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
const emptyBranch = (result: OptionResult = "hit"): OptionBranch => ({ result, classic: "", modern: null, note: null });

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
                      className={`${inputClass} w-24!`}
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
        .map((b) => ({ result: b.result, classic: b.classic.trim(), modern: b.modern?.trim() || null, note: cleanLocalized(b.note) }))
        .filter((b) => b.classic || b.note),
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