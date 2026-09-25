"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { HIT_STATES, POSITIONS, type HitState, type ScreenPosition } from "@/lib/types";

export type ComboFilterItem = {
  id: number;
  hitStates: HitState[];
  positionStart: ScreenPosition;
  card: ReactNode;
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
    >
      <span>{children}</span>
    </button>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** 히트 상태 / 시작 위치 태그 필터. 아무것도 선택하지 않으면 전체를 보여 준다. */
export function ComboFilters({ items, dict }: { items: ComboFilterItem[]; dict: Dictionary }) {
  const [hit, setHit] = useState<HitState[]>([]);
  const [pos, setPos] = useState<ScreenPosition[]>([]);

  const visible = items.filter(
    (item) =>
      (hit.length === 0 || item.hitStates.some((h) => hit.includes(h))) &&
      (pos.length === 0 || pos.includes(item.positionStart)),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">{dict.filter.hitState}</span>
          <div className="flex flex-wrap gap-1">
            {HIT_STATES.map((h) => (
              <Chip key={h} on={hit.includes(h)} onClick={() => setHit(toggle(hit, h))}>
                {dict.hitState[h]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">{dict.filter.position}</span>
          <div className="flex flex-wrap gap-1">
            {POSITIONS.map((p) => (
              <Chip key={p} on={pos.includes(p)} onClick={() => setPos(toggle(pos, p))}>
                {dict.position[p]}
              </Chip>
            ))}
          </div>
        </div>
        <p className="ml-auto text-sm text-muted">
          <span className="display text-2xl text-fg tabular-nums">{visible.length}</span> / {items.length}
          {dict.filter.count}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-muted">
          {items.length === 0 ? dict.combo.none : dict.combo.empty}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((item) => (
            <div key={item.id}>{item.card}</div>
          ))}
        </div>
      )}
    </div>
  );
}
