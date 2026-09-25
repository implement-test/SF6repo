"use client";

import { useEffect, useState } from "react";
import { findUnknownTokens, parseNotation } from "@/lib/notation/parse";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { ComboStarter, StarterGroup } from "@/lib/types";
import { damageBasisIndex, flattenStarters, normalizeStarterGroups } from "@/lib/starters";
import { NotationImage } from "../notation";
import { useAdmin } from "./admin-context";

export const inputClass =
  "w-full border border-border-strong bg-inset px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-accent";

/** 시동기 프리셋: 그룹 여러 개를 담는다 (예전 목록 형식은 이름 없는 그룹 하나로 읽는다) */
export type StarterPreset = { id: number; character_id: number; name: string; starters: StarterGroup[]; sort_order: number };

export function normalizePreset(raw: StarterPreset | (Omit<StarterPreset, "starters"> & { starters: unknown })): StarterPreset {
  return { ...raw, starters: normalizeStarterGroups(raw.starters) };
}

/** 프리셋을 콤보에 불러올 때의 그룹들. 이름 없는 그룹에는 프리셋 이름을 붙인다 */
export function presetToGroups(preset: StarterPreset): StarterGroup[] {
  return preset.starters
    .map((g) => ({ name: g.name?.trim() || preset.name, starters: cleanStarters(g.starters) }))
    .filter((g) => g.starters.length > 0);
}

/** 저장 전 정리: 클래식 표기가 빈 줄은 버리고, 모던이 비어 있으면 null(클래식 전용) */
export function cleanStarters(list: ComboStarter[] | null | undefined): ComboStarter[] {
  return (list ?? [])
    .map((s) => {
      const out: ComboStarter = { classic: s.classic.trim(), modern: s.modern?.trim() || null };
      if (s.damage_basis) out.damage_basis = true;
      return out;
    })
    .filter((s) => s.classic);
}


/**
 * 시동 기본기 목록: 추가 / 삭제 / 순서 변경.
 * (시동기 그룹 한 개의 내용. 그룹 편집은 StarterGroupsInput)
 */
export function StartersInput({
  label,
  help,
  value,
  onChange,
  basisIndex = null,
  onSelectBasis,
}: {
  label: string;
  help?: string;
  value: ComboStarter[];
  onChange: (v: ComboStarter[]) => void;
  /** 이 목록에서 데미지 기준인 시동기 번호 (없으면 null) */
  basisIndex?: number | null;
  /** 넘기면 줄마다 '데미지 기준' 선택 버튼이 나온다 (콤보 편집. 프리셋 편집에서는 넘기지 않는다) */
  onSelectBasis?: (i: number) => void;
}) {
  const update = (i: number, patch: Partial<ComboStarter>) =>
    onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const iconButton =
    "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs font-semibold text-muted">{label}</span>}
      {value.length === 0 && (
        <p className="border border-dashed border-border px-3 py-3 text-xs text-muted">
          {onSelectBasis ? "시동기가 없으면 루트만 표시됩니다." : "시동기를 추가하세요."}
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {value.map((s, i) => (
          <li key={i} className="flex flex-col gap-2 border border-border bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <span className={`display text-lg ${basisIndex === i ? "text-highlight-text" : "text-muted"}`}>{i + 1}</span>
              {onSelectBasis && (
                <button
                  type="button"
                  aria-pressed={basisIndex === i}
                  onClick={() => onSelectBasis(i)}
                  title="이 시동기를 데미지 기준으로"
                  className="border border-border-strong px-2 py-0.5 text-xs font-semibold text-muted hover:border-highlight hover:text-highlight-text aria-pressed:border-highlight aria-pressed:bg-highlight aria-pressed:text-highlight-fg"
                >
                  {basisIndex === i ? "★ 데미지 기준" : "데미지 기준으로"}
                </button>
              )}
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
            <NotationRow label="클래식" value={s.classic} onChange={(classic) => update(i, { classic })} placeholder="예: 2LP → 2LP" />
            <NotationRow
              label="모던"
              value={s.modern ?? ""}
              onChange={(modern) => update(i, { modern })}
              placeholder="비우면 클래식 전용"
            />
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...value, { classic: "", modern: null }])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 시동기 직접 추가
      </button>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

/** 저장 전 정리: 그룹마다 시동기를 정리하고, 빈 그룹은 버린다 */
export function cleanStarterGroups(groups: StarterGroup[] | null | undefined): StarterGroup[] {
  let seenBasis = false;
  return (groups ?? [])
    .map((g) => ({
      name: g.name?.trim() || null,
      // 데미지 기준 표시는 전체에서 하나만 남긴다
      starters: cleanStarters(g.starters).map((s) => {
        if (!s.damage_basis) return s;
        if (seenBasis) return { classic: s.classic, modern: s.modern };
        seenBasis = true;
        return s;
      }),
    }))
    .filter((g) => g.starters.length > 0);
}

/**
 * 콤보의 시동기 그룹 편집.
 * 프리셋을 불러오면 프리셋 이름의 그룹 하나로 들어가고, 빈 그룹을 만들어 직접 채울 수도 있다.
 * 첫 그룹의 첫 시동기가 데미지 기준.
 */
export function StarterGroupsInput({
  label,
  help,
  value,
  onChange,
  characterId,
  selectableBasis = true,
}: {
  label: string;
  help?: string;
  value: StarterGroup[];
  onChange: (v: StarterGroup[]) => void;
  /** 넘기면 그 캐릭터의 프리셋을 불러올 수 있다 */
  characterId?: number;
  /** 시동기 중 데미지 기준을 고를 수 있게 한다 (프리셋 편집에서는 끈다) */
  selectableBasis?: boolean;
}) {
  // 데미지 기준: 전체에서 하나. 고른 것이 없으면 첫 번째
  const basis = damageBasisIndex(value);
  const offsets = value.map((_, g) => value.slice(0, g).reduce((sum, x) => sum + x.starters.length, 0));
  const selectBasis = (g: number, i: number) =>
    onChange(
      value.map((group, gi) => ({
        ...group,
        starters: group.starters.map((s, si) => {
          const rest = { classic: s.classic, modern: s.modern };
          return gi === g && si === i ? { ...rest, damage_basis: true } : rest;
        }),
      })),
    );
  const update = (g: number, patch: Partial<StarterGroup>) =>
    onChange(value.map((x, i) => (i === g ? { ...x, ...patch } : x)));
  const move = (g: number, dir: -1 | 1) => {
    const next = [...value];
    [next[g], next[g + dir]] = [next[g + dir], next[g]];
    onChange(next);
  };
  const iconButton =
    "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {characterId !== undefined && (
        <PresetPicker
          characterId={characterId}
          onPick={(preset) => onChange([...value, ...presetToGroups(preset)])}
        />
      )}
      {value.length === 0 && (
        <p className="border border-dashed border-border px-3 py-3 text-xs text-muted">
          {characterId !== undefined
            ? "시동기가 없으면 루트만 표시됩니다. 프리셋을 불러오거나 그룹을 추가하세요."
            : "그룹을 추가하세요."}
        </p>
      )}
      {value.map((group, g) => (
        <div key={g} className="flex flex-col gap-2 border border-border-strong bg-surface p-2.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-bold text-muted">그룹</span>
            <input
              value={group.name ?? ""}
              onChange={(e) => update(g, { name: e.target.value })}
              placeholder="그룹 이름 (선택, 예: 약 시동)"
              className={inputClass}
            />
            <span className="flex shrink-0 gap-1">
              <button type="button" className={iconButton} disabled={g === 0} onClick={() => move(g, -1)} aria-label="그룹 위로">
                ↑
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={g === value.length - 1}
                onClick={() => move(g, 1)}
                aria-label="그룹 아래로"
              >
                ↓
              </button>
              <button
                type="button"
                className={`${iconButton} hover:border-warn hover:text-warn`}
                onClick={() => onChange(value.filter((_, i) => i !== g))}
                aria-label="그룹 삭제"
              >
                ×
              </button>
            </span>
          </div>
          <StartersInput
            label=""
            value={group.starters}
            onChange={(starters) => update(g, { starters })}
            basisIndex={selectableBasis && basis >= offsets[g] && basis < offsets[g] + group.starters.length ? basis - offsets[g] : null}
            onSelectBasis={selectableBasis ? (i) => selectBasis(g, i) : undefined}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { name: null, starters: [{ classic: "", modern: null }] }])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 빈 그룹 추가
      </button>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

/** 캐릭터의 시동기 프리셋을 골라 목록에 더한다 (이미 있는 시동기는 건너뛴다). */
function PresetPicker({ characterId, onPick }: { characterId: number; onPick: (preset: StarterPreset) => void }) {
  const { dataVersion } = useAdmin();
  const [presets, setPresets] = useState<StarterPreset[] | null>(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    supabaseBrowser()
      .from("starter_presets")
      .select("*")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data }) => setPresets((data ?? []).map(normalizePreset)));
  }, [characterId, dataVersion]);

  if (!presets) return null;
  if (presets.length === 0) {
    return (
      <p className="text-xs text-muted">
        등록된 시동기 프리셋이 없습니다. 캐릭터 페이지의 <b>시동기 프리셋</b> 버튼에서 만들 수 있습니다.
      </p>
    );
  }

  const preset = presets.find((p) => String(p.id) === selected);
  return (
    <div className="flex flex-col gap-1.5 border border-border bg-inset p-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-bold text-muted">프리셋</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputClass}>
          <option value="">— 프리셋 선택 —</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({flattenStarters(p.starters).length})
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!preset}
          onClick={() => {
            if (preset) onPick(preset);
            setSelected("");
          }}
          className="skew shrink-0 bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-40"
        >
          <span>불러오기</span>
        </button>
      </div>
      {preset && <StarterGroupsPreview groups={presetToGroups(preset)} />}
    </div>
  );
}

export function NotationRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const unknown = value ? findUnknownTokens(parseNotation(value)) : [];
  return (
    <div className="grid grid-cols-[3.2rem_1fr] items-start gap-2">
      <span className="pt-1.5 text-xs font-bold text-muted">{label}</span>
      <div className="flex flex-col gap-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={placeholder}
          className={`${inputClass} font-mono`}
        />
        {value && (
          <div className="flex min-h-10 items-center bg-inset px-2 py-1.5">
            <NotationImage notation={value} />
          </div>
        )}
        {unknown.length > 0 && <span className="text-xs text-warn">해석할 수 없는 부분: {unknown.join(", ")}</span>}
      </div>
    </div>
  );
}

/** 시동기 그룹 미리보기 (그룹 이름 + 시동기 아이콘) */
export function StarterGroupsPreview({ groups }: { groups: StarterGroup[] }) {
  let n = 0;
  return (
    <div className="flex flex-col gap-1.5 pl-1">
      {groups.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {g.name && <span className="text-[0.7rem] font-bold text-muted">— {g.name}</span>}
          <ul className="flex flex-col gap-1">
            {g.starters.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted">
                <span className="w-4 text-right">{++n}</span>
                <NotationImage notation={s.classic} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}