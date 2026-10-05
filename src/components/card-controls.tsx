"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** 목록의 카드를 모두 펼치거나 접는다. 대상: 가장 가까운 [data-card-list] 안의 카드 */
export function ExpandAllButton({ labels }: { labels: Dictionary["list"] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        const scope = e.currentTarget.closest("[data-card-list]") ?? document;
        const next = !expanded;
        scope.querySelectorAll<HTMLDetailsElement>("details[data-card], details[data-card-group]").forEach((d) => {
          // 그룹은 펼칠 때만 함께 연다 (모두 접기에서 그룹까지 닫으면 제목만 남아 찾기 어렵다)
          if (d.hasAttribute("data-card-group") && !next) return;
          d.open = next;
        });
        setExpanded(next);
      }}
      className="border border-border-strong px-3 py-1 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {expanded ? `▲ ${labels.collapseAll}` : `▼ ${labels.expandAll}`}
    </button>
  );
}
