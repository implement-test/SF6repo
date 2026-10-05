"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { HIT_STATES, POSITIONS, type HitState, type ScreenPosition, type TargetLevel } from "@/lib/types";
import { SortableCards } from "./admin/sortable-cards";
import { useHiddenLevels } from "./use-hidden-levels";
import { FavoriteFilter } from "./favorite-button";
import { useFavorites } from "@/lib/favorites";
import { ExpandAllButton } from "./card-controls";

export type ComboFilterItem = {
  id: number;
  level: TargetLevel;
  hitStates: HitState[];
  positionStart: ScreenPosition;
  groupId: number | null;
  card: ReactNode;
};

/** 콤보 그룹 (이름은 서버에서 언어에 맞춰 골라 둔다) */
export type ComboGroupItem = { id: number; name: string };

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

/**
 * 히트 상태 / 시작 위치 태그 필터. 아무것도 선택하지 않으면 전체를 보여 준다.
 * 그룹 없는 콤보를 먼저, 그 아래에 그룹별로 접을 수 있는 묶음을 보여 준다.
 */
export function ComboFilters({
  items,
  groups,
  dict,
  characterId,
}: {
  items: ComboFilterItem[];
  groups: ComboGroupItem[];
  dict: Dictionary;
  characterId: number;
}) {
  const [hit, setHit] = useState<HitState[]>([]);
  const [pos, setPos] = useState<ScreenPosition[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const favorites = useFavorites("combo");
  const favCount = items.filter((item) => favorites.has(item.id)).length;

  const isHidden = useHiddenLevels();

  const visible = items.filter(
    (item) =>
      (hit.length === 0 || item.hitStates.some((h) => hit.includes(h))) &&
      // '거리 무관' 콤보는 어떤 위치를 골라도 함께 보여 준다.
      (pos.length === 0 || pos.includes(item.positionStart) || item.positionStart === "any") &&
      (!favOnly || favorites.has(item.id)),
  );
  // 건수는 대상 수준 숨김까지 반영한다 (카드 자체는 CSS 가 숨긴다)
  const shown = visible.filter((item) => !isHidden(item.level));
  const shownCount = shown.length;
  const visibleIds = new Set(visible.map((i) => i.id));

  // 없는 그룹을 가리키는 콤보는 그룹 없음으로
  const groupIds = new Set(groups.map((g) => g.id));
  const groupOf = (item: ComboFilterItem) => (item.groupId !== null && groupIds.has(item.groupId) ? item.groupId : null);
  const sections = [
    { id: null as number | null, name: null as string | null },
    ...groups.map((g) => ({ id: g.id as number | null, name: g.name as string | null })),
  ]
    .map((section) => ({
      ...section,
      items: items.filter((item) => groupOf(item) === section.id),
      count: shown.filter((item) => groupOf(item) === section.id).length,
    }))
    .filter((section) => section.count > 0);

  const list = (sectionItems: ComboFilterItem[]) => (
    <SortableCards
      table="combos"
      characterId={characterId}
      items={sectionItems}
      visibleIds={visibleIds}
      className="flex flex-col gap-2"
    />
  );

  return (
    <div className="flex flex-col gap-4" data-card-list="">
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
        <FavoriteFilter on={favOnly} onToggle={() => setFavOnly(!favOnly)} count={favCount} label={dict.favorite.only} />
        <span className="ml-auto">
          <ExpandAllButton labels={dict.list} />
        </span>
        <p className="text-sm text-muted">
          <span className="display text-2xl text-fg tabular-nums">{shownCount}</span> / {items.length}
          {dict.filter.count}
        </p>
      </div>

      {shownCount === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-muted">
          {items.length === 0 ? dict.combo.none : favOnly && favCount === 0 ? dict.favorite.empty : dict.combo.empty}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {sections.map((section) =>
            section.id === null ? (
              <div key="ungrouped">{list(section.items)}</div>
            ) : (
              <details key={section.id} open data-card-group="" className="card-details flex flex-col">
                <summary className="mb-2 flex cursor-pointer items-center gap-2.5 border-b-2 border-accent pb-1.5 select-none">
                  <span aria-hidden className="card-chevron text-xs text-accent">
                    ▼
                  </span>
                  <span className="display text-xl">{section.name}</span>
                  <span className="text-sm text-muted tabular-nums">{section.count}</span>
                </summary>
                {list(section.items)}
              </details>
            ),
          )}
        </div>
      )}
    </div>
  );
}
