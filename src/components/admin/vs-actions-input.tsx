"use client";

import type { VsAction } from "@/lib/types";
import { cleanNote } from "@/lib/combo-routes";
import { NotationRow } from "./starters-input";
import { RouteNoteInput } from "./routes-input";

const emptyAction = (): VsAction => ({ classic: "", modern: null, note: null });

/** Vs 가이드의 관련 동작·대응 목록: 선택지마다 표기(클래식/모던)와 설명 */
export function VsActionsInput({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: VsAction[];
  onChange: (v: VsAction[]) => void;
}) {
  const update = (i: number, patch: Partial<VsAction>) =>
    onChange(value.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const iconButton =
    "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {value.length === 0 && (
        <p className="border border-dashed border-border px-3 py-2 text-xs text-muted">선택지가 없으면 공용 내용만 보입니다.</p>
      )}
      <ol className="flex flex-col gap-2">
        {value.map((a, i) => (
          <li key={i} className="flex flex-col gap-2 border border-border-strong bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="display text-lg text-muted">선택지 {i + 1}</span>
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
            <NotationRow label="클래식" value={a.classic} onChange={(classic) => update(i, { classic })} placeholder="예: 5HP → 236HP" />
            <NotationRow
              label="모던"
              value={a.modern ?? ""}
              onChange={(modern) => update(i, { modern })}
              placeholder="비우면 클래식 전용"
            />
            <RouteNoteInput label="이 선택지의 설명" value={a.note} onChange={(note) => update(i, { note })} />
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...value, emptyAction()])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 선택지 추가
      </button>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

/** 저장 전 정리: 표기도 설명도 없는 선택지는 버린다. 설명에 한국어가 빠졌으면 "missing-ko" */
export function cleanVsActions(list: VsAction[] | null | undefined): VsAction[] | "missing-ko" {
  const out: VsAction[] = [];
  for (const a of list ?? []) {
    const note = cleanNote(a.note);
    if (note === "missing-ko") return "missing-ko";
    const classic = a.classic.trim();
    if (!classic && !note) continue;
    out.push({ classic, modern: a.modern?.trim() || null, note });
  }
  return out;
}
