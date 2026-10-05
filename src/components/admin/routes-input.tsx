"use client";

import { useEffect, useState } from "react";
import type { ComboEnder, ComboFinish, ComboRoute, Localized } from "@/lib/types";
import { emptyFinish, emptyRoute } from "@/lib/combo-routes";
import { resolveEnder } from "@/lib/enders";
import { displayNotation } from "@/lib/notation/parse";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { NotationRow, inputClass } from "./starters-input";

/**
 * 콤보의 루트 목록: 루트마다 표기와 수치(데미지·콤보 후 프레임)를 적는다.
 * 첫 번째 루트가 기본으로 보이고, 카드에서 다른 루트에 마우스를 올리면 그 루트의 수치로 바뀐다.
 * '마무리'를 켜면 루트 아래에 마무리 탭이 생기고, 데미지·후상황은 마무리마다 적는다.
 * 엔더(콤보를 끝낸 기술)는 마지막 기술로 자동으로 찾고, 다르면 직접 고른다. 후상황을 비우면 엔더의 후상황을 쓴다.
 */
export function RoutesInput({
  label,
  help,
  value,
  onChange,
  characterId,
}: {
  label: string;
  help?: string;
  value: ComboRoute[];
  onChange: (v: ComboRoute[]) => void;
  characterId?: number;
}) {
  const routes = value.length > 0 ? value : [emptyRoute()];
  const [enders, setEnders] = useState<ComboEnder[]>([]);
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
  const update = (i: number, patch: Partial<ComboRoute>) =>
    onChange(routes.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...routes];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const iconButton =
    "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">
        {label} <span className="text-accent">*</span>
      </span>
      <ol className="flex flex-col gap-2">
        {routes.map((r, i) => (
          <li key={i} className="flex flex-col gap-2 border border-border-strong bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className={`display text-lg ${i === 0 ? "text-accent" : "text-muted"}`}>루트 {i + 1}</span>
              {i === 0 && routes.length > 1 && <span className="text-xs text-muted">(기본으로 보이는 루트)</span>}
              <span className="ml-auto flex gap-1">
                <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로">
                  ↑
                </button>
                <button
                  type="button"
                  className={iconButton}
                  disabled={i === routes.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="아래로"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${iconButton} hover:border-warn hover:text-warn`}
                  disabled={routes.length === 1}
                  onClick={() => onChange(routes.filter((_, j) => j !== i))}
                  aria-label="삭제"
                >
                  ×
                </button>
              </span>
            </div>
            <NotationRow label="클래식" value={r.classic} onChange={(classic) => update(i, { classic })} placeholder="예: 2MK → 236HP" />
            <NotationRow
              label="모던"
              value={r.modern ?? ""}
              onChange={(modern) => update(i, { modern })}
              placeholder="비우면 클래식 전용"
            />
            <label className="flex items-center gap-2 self-start text-sm font-semibold">
              <input
                type="checkbox"
                checked={r.finishes.length > 0}
                onChange={(e) => {
                  if (e.target.checked) return update(i, { finishes: [emptyFinish()] });
                  const filled = r.finishes.some((f) => f.classic.trim() || f.damage !== null || f.frame_after);
                  if (filled && !confirm("적어 둔 마무리를 모두 지울까요?")) return;
                  update(i, { finishes: [] });
                }}
                className="size-4 accent-[var(--highlight)]"
              />
              <span className="notation-finish">FINISH</span>
              마무리
              <span className="text-xs font-normal text-muted">(켜면 데미지 · 후상황을 마무리마다 적습니다)</span>
            </label>
            {r.finishes.length > 0 ? (
              <FinishesInput value={r.finishes} enders={enders} onChange={(finishes) => update(i, { finishes })} />
            ) : (
              <EndInputs
                classic={r.classic}
                damage={r.damage}
                frameAfter={r.frame_after}
                enderId={r.ender_id}
                enders={enders}
                onChange={(patch) => update(i, patch)}
              />
            )}
            {/* 루트가 여러 개일 때만: 이 루트만의 메모 (공용 메모는 '설명'의 메모 칸) */}
            {(routes.length > 1 || r.note) && (
              <RouteNoteInput value={r.note} onChange={(note) => update(i, { note })} />
            )}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...routes, emptyRoute()])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 루트 추가
      </button>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

const num = (v: string) => (v === "" ? null : Number(v));

/**
 * 끝나는 지점(마무리가 없는 루트, 또는 마무리 하나)의 데미지 · 엔더 · 후상황.
 * 엔더를 고르지 않으면 마지막 기술로 자동으로 찾고, 후상황을 비우면 엔더의 후상황을 쓴다.
 */
function EndInputs({
  classic,
  damage,
  frameAfter,
  enderId,
  enders,
  onChange,
}: {
  classic: string;
  damage: number | null;
  frameAfter: string | null;
  enderId: number | null;
  enders: ComboEnder[];
  onChange: (patch: { damage?: number | null; frame_after?: string | null; ender_id?: number | null }) => void;
}) {
  const auto = resolveEnder(classic, null, enders);
  const ender = resolveEnder(classic, enderId, enders);
  const name = (e: ComboEnder) => `${displayNotation(e.notation_classic)}${e.label ? ` (${e.label.ko})` : ""}`;
  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr]">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">데미지</span>
        <input
          type="number"
          min={0}
          step={1}
          value={damage ?? ""}
          onChange={(e) => onChange({ damage: num(e.target.value) })}
          className={`${inputClass} tabular-nums`}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">엔더 (셋업 연결)</span>
        <select
          value={enderId ?? ""}
          onChange={(e) => onChange({ ender_id: e.target.value ? Number(e.target.value) : null })}
          className={inputClass}
        >
          <option value="">자동: {auto ? name(auto) : "맞는 엔더 없음"}</option>
          {enders.map((e) => (
            <option key={e.id} value={e.id}>
              {name(e)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">콤보 후 프레임 (후상황)</span>
        <input
          value={frameAfter ?? ""}
          onChange={(e) => onChange({ frame_after: e.target.value || null })}
          placeholder={ender?.frame_after ? `비우면 엔더 기본값: ${ender.frame_after}` : "+32, 다운 +30"}
          className={inputClass}
        />
      </label>
    </div>
  );
}

const smallButton =
  "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

/** 루트의 마무리 여러 개: 탭으로 하나씩 고쳐 쓴다 */
function FinishesInput({
  value,
  enders,
  onChange,
}: {
  value: ComboFinish[];
  enders: ComboEnder[];
  onChange: (v: ComboFinish[]) => void;
}) {
  const [tab, setTab] = useState(0);
  const current = Math.min(tab, value.length - 1);
  const finish = value[current];
  const update = (patch: Partial<ComboFinish>) => onChange(value.map((f, j) => (j === current ? { ...f, ...patch } : f)));
  const swap = (to: number) => {
    const next = [...value];
    [next[to], next[current]] = [next[current], next[to]];
    onChange(next);
    setTab(to);
  };

  return (
    <div className="flex flex-col border border-highlight/40 bg-inset">
      <div role="tablist" className="flex flex-wrap items-end gap-1 border-b border-border px-2 pt-1">
        {value.map((_, j) => (
          <button
            key={j}
            type="button"
            role="tab"
            aria-selected={j === current}
            onClick={() => setTab(j)}
            className="border-b-2 border-transparent px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-fg aria-selected:border-highlight aria-selected:text-highlight-text"
          >
            마무리 {j + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            onChange([...value, emptyFinish()]);
            setTab(value.length);
          }}
          className="px-3 py-1.5 text-sm font-semibold text-muted hover:text-highlight-text"
        >
          + 마무리 추가
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">루트 끝에 이어지는 마무리</span>
          <span className="ml-auto flex gap-1">
            <button type="button" disabled={current === 0} onClick={() => swap(current - 1)} className={smallButton} aria-label="앞으로">
              ←
            </button>
            <button
              type="button"
              disabled={current === value.length - 1}
              onClick={() => swap(current + 1)}
              className={smallButton}
              aria-label="뒤로"
            >
              →
            </button>
            <button
              type="button"
              disabled={value.length === 1}
              onClick={() => {
                onChange(value.filter((_, j) => j !== current));
                setTab(Math.max(0, current - 1));
              }}
              className={`${smallButton} hover:border-warn hover:text-warn`}
              aria-label="이 마무리 삭제"
            >
              ×
            </button>
          </span>
        </div>
        <NotationRow label="클래식" value={finish.classic} onChange={(classic) => update({ classic })} placeholder="예: 236HP, sa3" />
        <NotationRow
          label="모던"
          value={finish.modern ?? ""}
          onChange={(modern) => update({ modern })}
          placeholder="비우면 클래식 전용"
        />
        <EndInputs
          classic={finish.classic}
          damage={finish.damage}
          frameAfter={finish.frame_after}
          enderId={finish.ender_id}
          enders={enders}
          onChange={update}
        />
      </div>
    </div>
  );
}

const NOTE_LANGS = [
  { key: "ko", placeholder: "한국어 (메모가 있으면 필수)" },
  { key: "en", placeholder: "English (선택)" },
  { key: "ja", placeholder: "日本語 (선택)" },
] as const;

/** 항목 하나의 메모 (ko / en / ja). 줄바꿈은 그대로 표시된다 (루트별 메모, Vs 선택지 설명) */
export function RouteNoteInput({
  value,
  onChange,
  label = "이 루트만의 메모",
}: {
  value: Localized | null;
  onChange: (v: Localized | null) => void;
  label?: string;
}) {
  const note: Partial<Localized> = value ?? {};
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-2">
      <span className="text-xs text-muted">{label}</span>
      {NOTE_LANGS.map((lang) => (
        <div key={lang.key} className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
          <span className="pt-1.5 text-xs font-bold uppercase text-muted">{lang.key}</span>
          <textarea
            rows={1}
            value={note[lang.key] ?? ""}
            onChange={(e) => onChange({ ...note, [lang.key]: e.target.value } as Localized)}
            placeholder={lang.placeholder}
            className={`${inputClass} field-sizing-content min-h-9 resize-y`}
          />
        </div>
      ))}
    </div>
  );
}
