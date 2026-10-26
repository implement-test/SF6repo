"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

/**
 * 셋업 포스트 안의 셋업 여러 개를 탭으로 (0031).
 * 탭마다 내용(children 하나씩)은 모두 HTML 에 그려 두고 고른 것만 보인다.
 * 주소가 #setup-12-v2 면 그 탭을 고른다 (콤보 카드의 셋업 링크). 첫 번째 탭은 #setup-12 (포스트) 그대로.
 */
export function SetupVariantTabs({ baseId, labels, children }: { baseId: string; labels: ReactNode[]; children: ReactNode }) {
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);

  useEffect(() => {
    function fromHash() {
      const m = new RegExp(`^${baseId}-v(\\d+)$`).exec(decodeURIComponent(window.location.hash.slice(1)));
      if (m) setActive(Math.min(Number(m[1]) - 1, panels.length - 1));
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [baseId, panels.length]);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2 border-b border-border pb-3">
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${baseId}-v${i + 1}`}
            onClick={() => setActive(i)}
            className={`skew border px-3 py-1 text-sm font-bold transition-colors ${
              i === active ? "border-accent bg-accent text-accent-fg" : "border-border-strong text-muted hover:border-accent hover:text-fg"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">{label}</span>
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div key={i} id={`${baseId}-v${i + 1}`} role="tabpanel" hidden={i !== active} className="flex flex-col gap-4">
          {panel}
        </div>
      ))}
    </div>
  );
}
