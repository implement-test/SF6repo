"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { VS_TOPICS, type TargetLevel, type VsTopic } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { setVsCounts, useVsOpponent } from "@/lib/vs-store";
import { SortableCards } from "./admin/sortable-cards";
import { AddButton } from "./admin/admin-context";
import { ReorderButton } from "./admin/reorder-button";
import { VsImportButton } from "./admin/vs-import-button";
import { FavoriteFilter } from "./favorite-button";
import { useHiddenLevels } from "./use-hidden-levels";

export type VsListItem = { id: number; opponent: string; topic: VsTopic; level: TargetLevel; card: ReactNode };

/**
 * Vs 가이드 목록. 상대는 필터 바 위의 상대 선택 칸(vs-store)에서, 주제·즐겨찾기는 여기서 거른다.
 * 상대별 공략 수를 상대 선택 칸에 알려 준다.
 */
export function VsGuideList({
  items,
  dict,
  characterId,
  characterName,
}: {
  items: VsListItem[];
  dict: Dictionary;
  characterId: number;
  /** 관리자 화면용 (한국어) */
  characterName: string;
}) {
  const opponent = useVsOpponent();
  const [topics, setTopics] = useState<VsTopic[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const favorites = useFavorites("vs");
  const isHidden = useHiddenLevels();

  // 상대 선택 칸의 숫자
  const countsKey = items.map((i) => i.opponent).join(",");
  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const slug of countsKey ? countsKey.split(",") : []) counts[slug] = (counts[slug] ?? 0) + 1;
    setVsCounts(counts);
  }, [countsKey]);

  const forOpponent = items.filter((i) => !opponent || i.opponent === opponent);
  const favCount = forOpponent.filter((i) => favorites.has(i.id)).length;
  const visible = forOpponent.filter(
    (i) => (topics.length === 0 || topics.includes(i.topic)) && (!favOnly || favorites.has(i.id)),
  );
  const shownCount = visible.filter((i) => !isHidden(i.level)).length;

  // 관리자 버튼: 새 항목은 지금 고른 상대로 시작한다
  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <VsImportButton characterId={characterId} characterName={characterName} opponent={opponent} />
      <ReorderButton table="vs_guides" characterId={characterId} label="Vs 가이드" />
      <AddButton
        entity="vs"
        label="Vs 가이드 추가"
        scope={characterId}
        defaults={{ character_id: characterId, ...(opponent ? { opponent } : {}) }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">{dict.vs.topic}</span>
          <div className="flex flex-wrap gap-1">
            {VS_TOPICS.map((t) => {
              const on = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTopics(on ? topics.filter((x) => x !== t) : [...topics, t])}
                  className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
                >
                  <span>{dict.vs.topics[t]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <FavoriteFilter on={favOnly} onToggle={() => setFavOnly(!favOnly)} count={favCount} label={dict.favorite.only} />
        <p className="ml-auto text-sm text-muted">
          <span className="display text-2xl text-fg tabular-nums">{shownCount}</span> / {forOpponent.length}
          {dict.filter.count}
        </p>
      </div>

      {shownCount === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-muted">
          {forOpponent.length === 0 ? dict.vs.empty : favOnly && favCount === 0 ? dict.favorite.empty : dict.vs.none}
        </p>
      ) : (
        <SortableCards
          table="vs_guides"
          characterId={characterId}
          items={items}
          visibleIds={new Set(visible.map((i) => i.id))}
          className="flex flex-col gap-2"
        />
      )}
      {adminActions}
    </div>
  );
}
