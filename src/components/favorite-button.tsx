"use client";

import { toggleFavorite, useFavorites, type FavoriteKind } from "@/lib/favorites";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** 목록 필터: 즐겨찾기한 항목만 보기. count 는 이 목록 안의 즐겨찾기 수 */
export function FavoriteFilter({
  on,
  onToggle,
  count,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  count: number;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className="skew border border-highlight/60 px-3 py-1 text-sm font-bold text-highlight-text transition-colors hover:bg-highlight/10 aria-pressed:bg-highlight aria-pressed:text-highlight-fg"
    >
      <span>
        ★ {label} <span className="tabular-nums opacity-80">({count})</span>
      </span>
    </button>
  );
}

/** 카드의 즐겨찾기 버튼 (☆ / ★). 로그인 없이 이 브라우저에 저장된다 */
export function FavoriteButton({
  kind,
  id,
  labels,
}: {
  kind: FavoriteKind;
  id: number;
  labels: Dictionary["favorite"];
}) {
  const on = useFavorites(kind).has(id);
  const label = on ? labels.remove : labels.add;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => toggleFavorite(kind, id)}
      title={label}
      aria-label={label}
      className="inline-grid size-7 place-items-center border border-border-strong text-base leading-none text-muted transition-colors hover:border-highlight hover:text-highlight-text aria-pressed:border-highlight aria-pressed:text-highlight-text"
    >
      {on ? "★" : "☆"}
    </button>
  );
}
