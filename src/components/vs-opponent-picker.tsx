"use client";

import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";
import { ROSTER, ROSTER_GROUPS } from "@/lib/roster";
import { setVsOpponent, useVsCounts, useVsOpponent } from "@/lib/vs-store";

/**
 * Vs 가이드의 상대 캐릭터 선택. 캐릭터 레이아웃의 탭 아래에 두고, Vs 탭에서만 보인다.
 * 빠르게 고르도록 이름만 있는 드롭다운. 분류(초기 로스터 / 시즌 1~4)로 묶고, 이름 옆에 공략 수.
 */
export function VsOpponentPicker({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const pathname = usePathname();
  const opponent = useVsOpponent();
  const counts = useVsCounts();
  if (!pathname.endsWith("/vs")) return null;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const withCount = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

  return (
    <label className="flex items-center gap-3 border border-border bg-surface px-4 py-2.5">
      <span className="eyebrow shrink-0">{dict.vs.opponent}</span>
      <select
        value={opponent ?? ""}
        onChange={(e) => setVsOpponent(e.target.value || null)}
        className="min-w-0 flex-1 border border-border-strong bg-bg px-2 py-1.5 font-bold sm:max-w-xs"
      >
        <option value="">{withCount(dict.vs.all, total)}</option>
        {ROSTER_GROUPS.map((group) => (
          <optgroup key={group.id} label={pickLocalized(group.name, locale).text}>
            {ROSTER.filter((c) => c.group === group.id).map((c) => (
              <option key={c.slug} value={c.slug}>
                {withCount(pickLocalized(c.name, locale).text, counts[c.slug] ?? 0)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
