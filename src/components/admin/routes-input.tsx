"use client";

import type { ComboRoute } from "@/lib/types";
import { emptyRoute } from "@/lib/combo-routes";
import { NotationRow, inputClass } from "./starters-input";

/**
 * 콤보의 루트 목록: 루트마다 표기와 수치(데미지·프레임·게이지 소모)를 적는다.
 * 첫 번째 루트가 기본으로 보이고, 카드에서 다른 루트에 마우스를 올리면 그 루트의 수치로 바뀐다.
 */
export function RoutesInput({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: ComboRoute[];
  onChange: (v: ComboRoute[]) => void;
}) {
  const routes = value.length > 0 ? value : [emptyRoute()];
  const update = (i: number, patch: Partial<ComboRoute>) =>
    onChange(routes.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...routes];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const iconButton =
    "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";
  const num = (v: string) => (v === "" ? null : Number(v));

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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">데미지</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={r.damage ?? ""}
                  onChange={(e) => update(i, { damage: num(e.target.value) })}
                  className={`${inputClass} tabular-nums`}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">콤보 후 프레임</span>
                <input
                  value={r.frame_after ?? ""}
                  onChange={(e) => update(i, { frame_after: e.target.value || null })}
                  placeholder="+32, 다운 +30"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">드라이브 (칸)</span>
                <input
                  type="number"
                  min={0}
                  max={6}
                  step={0.5}
                  value={r.drive_cost}
                  onChange={(e) => update(i, { drive_cost: num(e.target.value) ?? 0 })}
                  className={`${inputClass} tabular-nums`}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted">SA (칸)</span>
                <input
                  type="number"
                  min={0}
                  max={3}
                  step={1}
                  value={r.sa_cost}
                  onChange={(e) => update(i, { sa_cost: num(e.target.value) ?? 0 })}
                  className={`${inputClass} tabular-nums`}
                />
              </label>
            </div>
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
