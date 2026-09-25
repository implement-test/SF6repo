"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { normalizeNotation } from "@/lib/notation/parse";
import {
  GUARD_SETTINGS,
  type GuardSetting,
  type Localized,
  type PracticeConfig,
  type SetupOption,
  type SetupSituation,
} from "@/lib/types";
import { NotationImage } from "../notation";
import { inputClass, NotationRow } from "./starters-input";

const GUARD_LABELS: Record<GuardSetting, string> = {
  all: "전부 가드",
  none: "가드 안 함",
  after_first: "첫 타 후 가드",
  random: "랜덤 가드",
};

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
  starters: { classic: string }[] | null;
  end_position: string | null;
  frame_after: string | null;
  is_published: boolean;
};

const POSITION_KO: Record<string, string> = { midscreen: "필드", corner: "코너", near_corner: "코너 근처", any: "거리 무관", other: "기타" };

/** 이 셋업으로 이어지는 콤보 고르기: 검색해서 추가, 순서 변경, 빼기 */
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
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (characterId === undefined) return;
    supabaseBrowser()
      .from("combos")
      .select("id,title,notation_classic,starters,end_position,frame_after,is_published")
      .eq("character_id", characterId)
      .order("sort_order")
      .then(({ data }) => setCombos(data ?? []));
  }, [characterId]);

  const byId = useMemo(() => new Map(combos.map((c) => [c.id, c])), [combos]);
  const q = query.trim().toLowerCase();
  const results = q
    ? combos
        .filter((c) => !value.includes(c.id))
        .filter((c) =>
          [c.title?.ko ?? "", c.notation_classic, ...(c.starters ?? []).map((s) => s.classic)]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 8)
    : [];

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <Heading label={label} help={help} />
      {value.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {value.map((id, i) => {
            const c = byId.get(id);
            return (
              <li key={id} className="flex items-start gap-2 border border-border bg-surface-2 p-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs font-semibold">
                    {c?.title?.ko ?? `콤보 #${id}`}
                    {c && !c.is_published && <span className="ml-1 text-warn">(비공개)</span>}
                  </span>
                  {c && <NotationImage notation={c.notation_classic} />}
                  {c && (
                    <span className="text-xs text-muted">
                      콤보 후 위치 {c.end_position ? POSITION_KO[c.end_position] : "미입력"} · 콤보 후 프레임{" "}
                      {c.frame_after ?? "미입력"}
                    </span>
                  )}
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
                    onClick={() => onChange(value.filter((v) => v !== id))}
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
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="콤보 검색 (제목, 루트, 시동기 표기)…"
          className={inputClass}
        />
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto border border-accent bg-surface shadow-xl">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...value, c.id]);
                    setQuery("");
                  }}
                  className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <span className="text-xs font-semibold">{c.title?.ko ?? `콤보 #${c.id}`}</span>
                  <span className="font-mono text-xs text-muted">{normalizeNotation(c.notation_classic)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q && results.length === 0 && <p className="mt-1 text-xs text-muted">찾는 콤보가 없습니다.</p>}
      </div>
    </div>
  );
}

// ───────────────────────── 옵션 A/B/... ─────────────────────────

const LANGS = ["ko", "en", "ja"] as const;
const nextLabel = (list: SetupOption[]) => String.fromCharCode(65 + list.length); // A, B, C …

export function OptionsInput({ value, onChange }: { value: SetupOption[]; onChange: (v: SetupOption[]) => void }) {
  const update = (i: number, patch: Partial<SetupOption>) => onChange(value.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {value.map((o, i) => (
        <div key={i} className="flex flex-col gap-2 border border-border bg-surface-2 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">옵션</span>
            <input
              value={o.label}
              onChange={(e) => update(i, { label: e.target.value })}
              className={`${inputClass} w-16! text-center font-bold`}
              aria-label="옵션 이름"
            />
            <span className="ml-auto flex gap-1">
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
                aria-label="삭제"
              >
                ×
              </button>
            </span>
          </div>
          <NotationRow label="클래식" value={o.classic} onChange={(classic) => update(i, { classic })} placeholder="예: 2MK → DRC → 5HP" />
          <NotationRow label="모던" value={o.modern ?? ""} onChange={(modern) => update(i, { modern })} placeholder="비우면 클래식 전용" />
          {LANGS.map((lang) => (
            <div key={lang} className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
              <span className="pt-1.5 text-xs font-bold uppercase text-muted">{lang}</span>
              <input
                value={o.description?.[lang] ?? ""}
                onChange={(e) =>
                  update(i, { description: { ...(o.description ?? { ko: "" }), [lang]: e.target.value } as Localized })
                }
                placeholder={lang === "ko" ? "설명 (한국어)" : "설명 (선택)"}
                className={inputClass}
              />
            </div>
          ))}
          <div className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
            <span className="pt-1.5 text-xs font-bold text-muted">영상</span>
            <input
              type="url"
              value={o.youtube_url ?? ""}
              onChange={(e) => update(i, { youtube_url: e.target.value })}
              placeholder="YouTube URL (선택)"
              className={inputClass}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { label: nextLabel(value), classic: "", modern: null, description: null, youtube_url: null }])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 옵션 추가
      </button>
    </div>
  );
}

// ───────────────────────── 프랙티스 설정 ─────────────────────────

export const emptyPractice = (): PracticeConfig => ({
  guard: "all",
  playback: "random",
  wakeup: [],
  after_guard: { count: null, slots: [] },
  after_hit: [],
  notes: null,
});

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
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">가드</span>
          <select
            value={value.guard ?? ""}
            onChange={(e) => set({ guard: (e.target.value || null) as GuardSetting | null })}
            className={inputClass}
          >
            <option value="">— (지정 안 함)</option>
            {GUARD_SETTINGS.map((g) => (
              <option key={g} value={g}>
                {GUARD_LABELS[g]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">녹화 슬롯 재생</span>
          <select
            value={value.playback}
            onChange={(e) => set({ playback: e.target.value as PracticeConfig["playback"] })}
            className={inputClass}
          >
            <option value="random">랜덤 재생</option>
            <option value="sequential">순서대로</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-auto text-xs font-semibold text-muted hover:text-warn"
        >
          프랙티스 설정 빼기
        </button>
      </div>

      <SlotList label="기상 시 리버설" slots={value.wakeup} onChange={(wakeup) => set({ wakeup })} />
      <div className="flex flex-col gap-1.5">
        <SlotList
          label="가드 후 리버설"
          slots={value.after_guard.slots}
          onChange={(slots) => set({ after_guard: { ...value.after_guard, slots } })}
        />
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="number"
            min={1}
            value={value.after_guard.count ?? ""}
            onChange={(e) => set({ after_guard: { ...value.after_guard, count: e.target.value ? Number(e.target.value) : null } })}
            className={`${inputClass} w-20!`}
          />
          회 가드 후 (비우면 매번)
        </label>
      </div>
      <SlotList label="피격 후 리버설" slots={value.after_hit} onChange={(after_hit) => set({ after_hit })} />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">메모</span>
        {LANGS.map((lang) => (
          <div key={lang} className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
            <span className="pt-1.5 text-xs font-bold uppercase text-muted">{lang}</span>
            <input
              value={value.notes?.[lang] ?? ""}
              onChange={(e) => set({ notes: { ...(value.notes ?? { ko: "" }), [lang]: e.target.value } as Localized })}
              placeholder={lang === "ko" ? "예: 더미 위치 코너, 상대 체력 …" : "(선택)"}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 녹화 슬롯 목록. 콤보 표기로 적는다 (2LP, LPLK, 4 …) */
function SlotList({ label, slots, onChange }: { label: string; slots: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {slots.map((slot, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="display w-4 pt-1.5 text-right text-muted">{i + 1}</span>
          <div className="flex-1">
            <NotationRow
              label="슬롯"
              value={slot}
              onChange={(v) => onChange(slots.map((s, j) => (j === i ? v : s)))}
              placeholder="예: 2LP / LPLK / 4"
            />
          </div>
          <button
            type="button"
            className={`${iconButton} hover:border-warn hover:text-warn`}
            onClick={() => onChange(slots.filter((_, j) => j !== i))}
            aria-label="슬롯 삭제"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...slots, ""])}
        className="self-start border border-dashed border-border-strong px-2.5 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 슬롯
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
      label: o.label.trim() || String.fromCharCode(65 + i),
      classic: o.classic.trim(),
      modern: o.modern?.trim() || null,
      description: cleanLocalized(o.description),
      youtube_url: o.youtube_url?.trim() || null,
    }))
    .filter((o) => o.classic || o.description);
}

export function cleanPractice(p: PracticeConfig | null | undefined): PracticeConfig | null {
  if (!p) return null;
  const slots = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);
  return {
    guard: p.guard,
    playback: p.playback,
    wakeup: slots(p.wakeup),
    after_guard: { count: p.after_guard.count || null, slots: slots(p.after_guard.slots) },
    after_hit: slots(p.after_hit),
    notes: cleanLocalized(p.notes),
  };
}
