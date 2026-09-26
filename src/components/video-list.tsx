"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { VIDEO_LANGUAGES, type TargetLevel, type VideoLanguage } from "@/lib/types";
import { SortableCards } from "./admin/sortable-cards";
import { useHiddenLevels } from "./use-hidden-levels";

export type VideoListItem = { id: number; level: TargetLevel; language: VideoLanguage; card: ReactNode };

/** 추천 영상 목록: 영상 언어로 거르기 + 대상 수준 숨김 반영. 관리자는 카드 옆에서 순서를 바꾼다 */
export function VideoList({
  items,
  dict,
  characterId,
}: {
  items: VideoListItem[];
  dict: Dictionary;
  characterId: number;
}) {
  const [languages, setLanguages] = useState<VideoLanguage[]>([]);
  const isHidden = useHiddenLevels();
  const present = VIDEO_LANGUAGES.filter((l) => items.some((i) => i.language === l));
  const visible = items.filter((i) => languages.length === 0 || languages.includes(i.language));
  const shownCount = visible.filter((i) => !isHidden(i.level)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        {present.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {present.map((l) => {
              const on = languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setLanguages(on ? languages.filter((x) => x !== l) : [...languages, l])}
                  className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
                >
                  <span>{dict.videos.languages[l]}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="ml-auto text-sm text-muted">
          <span className="display text-2xl text-fg tabular-nums">{shownCount}</span> / {items.length}
          {dict.filter.count}
        </p>
      </div>

      {shownCount === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-muted">
          {items.length === 0 ? dict.videos.empty : dict.videos.none}
        </p>
      ) : (
        <SortableCards
          table="videos"
          characterId={characterId}
          items={items}
          visibleIds={new Set(visible.map((i) => i.id))}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        />
      )}
    </div>
  );
}
