"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TargetLevel } from "@/lib/types";
import { SortableCards } from "./admin/sortable-cards";
import { useHiddenLevels } from "./use-hidden-levels";
import { FavoriteFilter } from "./favorite-button";
import { useFavorites } from "@/lib/favorites";
import { ExpandAllButton } from "./card-controls";

export type SetupFilterItem = { id: number; level: TargetLevel; situations: string[]; card: ReactNode };

/**
 * 상황 태그 필터. 아무것도 고르지 않으면 전체를 보여 준다.
 * 추천 연습(kind="practice")도 같은 목록을 쓴다 (상황 태그 없음).
 */
export function SetupFilters({
  kind = "setup",
  items,
  situations,
  dict,
  characterId,
}: {
  kind?: "setup" | "practice";
  characterId: number;
  items: SetupFilterItem[];
  situations: { slug: string; name: string }[];
  dict: Dictionary;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const favorites = useFavorites(kind);
  const texts = kind === "practice" ? dict.practice : dict.setup;
  const favCount = items.filter((i) => favorites.has(i.id)).length;
  // '거리 무관' 셋업은 어떤 위치를 골라도 함께 보여 준다.
  const visible = items.filter(
    (i) =>
      (selected.length === 0 || i.situations.includes("any") || i.situations.some((s) => selected.includes(s))) &&
      (!favOnly || favorites.has(i.id)),
  );
  // 건수는 대상 수준 숨김까지 반영한다 (카드 자체는 CSS 가 숨긴다)
  const isHidden = useHiddenLevels();
  const shownCount = visible.filter((i) => !isHidden(i.level)).length;

  return (
    <div className="flex flex-col gap-4" data-card-list="">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        {situations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">{dict.setup.situation}</span>
            <div className="flex flex-wrap gap-1">
              {situations.map((s) => {
                const on = selected.includes(s.slug);
                return (
                  <button
                    key={s.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelected(on ? selected.filter((x) => x !== s.slug) : [...selected, s.slug])}
                    className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
                  >
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
          {items.length === 0 ? texts.empty : favOnly && favCount === 0 ? dict.favorite.empty : texts.none}
        </p>
      ) : (
        <SortableCards
          table={kind === "practice" ? "practices" : "setups"}
          characterId={characterId}
          items={items}
          visibleIds={new Set(visible.map((i) => i.id))}
          className="flex flex-col gap-3"
        />
      )}
    </div>
  );
}
