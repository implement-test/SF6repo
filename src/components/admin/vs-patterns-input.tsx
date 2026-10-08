"use client";

import type { VsPattern, VsPunish, VsResponse } from "@/lib/types";
import { emptyPattern, emptyResponse } from "@/lib/vs-patterns";
import { NotationRow, inputClass } from "./starters-input";
import { RouteNoteInput } from "./routes-input";
import { ClockInput } from "./clock-input";

const iconButton =
  "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

const PUNISH_OPTIONS: { value: VsPunish | ""; label: string }[] = [
  { value: "", label: "구분 없음" },
  { value: "confirmed", label: "확정" },
  { value: "range", label: "거리 한정" },
];

/** ↑ ↓ × 버튼 */
function ItemTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (dir: -1 | 1) => void; onRemove: () => void }) {
  return (
    <span className="ml-auto flex gap-1">
      <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(-1)} aria-label="위로">
        ↑
      </button>
      <button type="button" className={iconButton} disabled={index === count - 1} onClick={() => onMove(1)} aria-label="아래로">
        ↓
      </button>
      <button type="button" className={`${iconButton} hover:border-warn hover:text-warn`} onClick={onRemove} aria-label="삭제">
        ×
      </button>
    </span>
  );
}

function swap<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const next = [...list];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
}

const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));

/**
 * Vs 가이드의 상대 패턴 목록: 패턴마다 상대 기술 표기 · 이름 · 설명 · 프레임 범위 · 영상, 그 아래 대응 여러 개.
 * 대응마다 내 기술 표기 · 딜캐 구분(확정 / 거리 한정) · 설명.
 */
export function VsPatternsInput({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: VsPattern[];
  onChange: (v: VsPattern[]) => void;
}) {
  const update = (i: number, patch: Partial<VsPattern>) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {value.length === 0 && (
        <p className="border border-dashed border-border px-3 py-2 text-xs text-muted">상대 패턴이 없으면 공용 내용만 보입니다.</p>
      )}
      <ol className="flex flex-col gap-3">
        {value.map((p, i) => (
          <li key={i} className="flex flex-col gap-2 border border-accent/50 bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="display text-lg text-accent">상대 패턴 {i + 1}</span>
              <ItemTools
                index={i}
                count={value.length}
                onMove={(dir) => onChange(swap(value, i, dir))}
                onRemove={() => {
                  if ((p.classic || p.responses.some((r) => r.classic)) && !confirm("이 상대 패턴과 대응을 모두 지울까요?")) return;
                  onChange(value.filter((_, j) => j !== i));
                }}
              />
            </div>
            <NotationRow label="클래식" value={p.classic} onChange={(classic) => update(i, { classic })} placeholder="상대 기술, 예: 236P" />
            <NotationRow label="모던" value={p.modern ?? ""} onChange={(modern) => update(i, { modern })} placeholder="비우면 클래식 전용" />
            <RouteNoteInput label="이름 (선택, 예: 장풍)" value={p.name} onChange={(name) => update(i, { name })} />
            <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2">
              <span className="text-xs text-muted">프레임</span>
              <input
                type="number"
                step={1}
                value={p.frame_min ?? ""}
                onChange={(e) => update(i, { frame_min: num(e.target.value) })}
                placeholder="예: -8"
                className={`${inputClass} tabular-nums`}
                aria-label="프레임 (가까울 때)"
              />
              <span className="text-muted">~</span>
              <input
                type="number"
                step={1}
                value={p.frame_max ?? ""}
                onChange={(e) => update(i, { frame_max: num(e.target.value) })}
                placeholder="예: -12 (같으면 비움)"
                className={`${inputClass} tabular-nums`}
                aria-label="프레임 (멀 때)"
              />
            </div>
            <span className="-mt-1 text-xs text-muted">거리에 따라 다르면 두 칸에, 하나면 왼쪽 칸만. 주제가 딜캐면 카드에 “가드 시”로 표시됩니다.</span>
            <RouteNoteInput label="이 패턴의 설명 (선택)" value={p.note} onChange={(note) => update(i, { note })} />

            {/* 패턴별 영상 */}
            <div className="flex flex-col gap-1.5 border-t border-border pt-2">
              <span className="text-xs text-muted">이 패턴의 영상 (YouTube / X, 선택)</span>
              <input
                type="url"
                value={p.youtube_url ?? ""}
                onChange={(e) => update(i, { youtube_url: e.target.value || null })}
                placeholder="https://youtu.be/…"
                className={inputClass}
              />
              {p.youtube_url && (
                <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 text-xs text-muted">
                  <span>구간</span>
                  <ClockInput value={p.youtube_start} onChange={(youtube_start) => update(i, { youtube_start })} placeholder="시작 1:23" />
                  <span>~</span>
                  <ClockInput value={p.youtube_end} onChange={(youtube_end) => update(i, { youtube_end })} placeholder="끝 (선택)" />
                  <label className="flex items-center gap-1.5 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={p.youtube_loop}
                      onChange={(e) => update(i, { youtube_loop: e.target.checked })}
                      className="size-4"
                    />
                    반복
                  </label>
                </div>
              )}
            </div>

            <ResponsesInput value={p.responses} onChange={(responses) => update(i, { responses })} />
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...value, emptyPattern()])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 상대 패턴 추가
      </button>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

/** 상대 패턴 하나에 대한 대응 여러 개 */
function ResponsesInput({ value, onChange }: { value: VsResponse[]; onChange: (v: VsResponse[]) => void }) {
  const update = (i: number, patch: Partial<VsResponse>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <span className="text-xs font-semibold text-muted">대응</span>
      <ol className="flex flex-col gap-2 pl-3">
        {value.map((r, i) => (
          <li key={i} className="flex flex-col gap-2 border-l-2 border-border-strong bg-surface-2 p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted">└ 대응 {i + 1}</span>
              <select
                value={r.punish ?? ""}
                onChange={(e) => update(i, { punish: (e.target.value || null) as VsPunish | null })}
                className={`${inputClass} w-auto`}
                aria-label="딜캐 구분"
              >
                {PUNISH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ItemTools
                index={i}
                count={value.length}
                onMove={(dir) => onChange(swap(value, i, dir))}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
              />
            </div>
            <NotationRow label="클래식" value={r.classic} onChange={(classic) => update(i, { classic })} placeholder="내 대응, 예: 2MP → 236HP" />
            <NotationRow label="모던" value={r.modern ?? ""} onChange={(modern) => update(i, { modern })} placeholder="비우면 클래식 전용" />
            <RouteNoteInput label="이 대응의 설명" value={r.note} onChange={(note) => update(i, { note })} />
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...value, emptyResponse()])}
        className="ml-3 self-start border border-dashed border-border-strong px-3 py-1 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 대응 추가
      </button>
    </div>
  );
}
