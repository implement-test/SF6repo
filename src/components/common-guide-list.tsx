"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { GUIDE_TOPICS, type GuideTopic, type TargetLevel } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { SortableCards } from "./admin/sortable-cards";
import { FavoriteFilter } from "./favorite-button";
import { ExpandAllButton } from "./card-controls";
import { useHiddenLevels } from "./use-hidden-levels";

export type CommonGuideItem = { id: number; topic: GuideTopic; level: TargetLevel; card: ReactNode };

/** 공통 공략의 시스템 글 목록: 주제 · 즐겨찾기로 거른다. 관리자(최고/부)는 카드 옆에서 순서를 바꾼다 */
export function CommonGuideList({ items, dict }: { items: CommonGuideItem[]; dict: Dictionary }) {
  const [topics, setTopics] = useState<GuideTopic[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const favorites = useFavorites("guide");
  const isHidden = useHiddenLevels();
  const present = GUIDE_TOPICS.filter((t) => items.some((i) => i.topic === t));
  const favCount = items.filter((i) => favorites.has(i.id)).length;
  const visible = items.filter(
    (i) => (topics.length === 0 || topics.includes(i.topic)) && (!favOnly || favorites.has(i.id)),
  );
  // 건수는 대상 수준 숨김까지 반영한다 (카드 자체는 CSS 가 숨긴다)
  const shownCount = visible.filter((i) => !isHidden(i.level)).length;

  return (
    <div className="flex flex-col gap-4" data-card-list="">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        {present.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">{dict.guide.topic}</span>
            <div className="flex flex-wrap gap-1">
              {present.map((t) => {
                const on = topics.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTopics(on ? topics.filter((x) => x !== t) : [...topics, t])}
                    className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
                  >
                    <span>{dict.guide.topics[t]}</span>
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
          {items.length === 0 ? dict.guide.empty : favOnly && favCount === 0 ? dict.favorite.empty : dict.guide.none}
        </p>
      ) : (
        <SortableCards
          table="common_guides"
          characterId={null}
          items={items}
          visibleIds={new Set(visible.map((i) => i.id))}
          className="flex flex-col gap-3"
        />
      )}
    </div>
  );
}
