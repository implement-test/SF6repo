"use client";

import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";
import { ROSTER, ROSTER_GROUPS, type RosterGroup } from "@/lib/roster";
import { setVsGroup, setVsOpponent, useVsCounts, useVsGroup, useVsOpponent } from "@/lib/vs-store";

const SELECT_CLASS = "min-w-0 flex-1 border border-border-strong bg-bg px-2 py-1 text-sm font-semibold disabled:opacity-50 sm:max-w-56";

/**
 * Vs 가이드의 상대 캐릭터 선택. 캐릭터 레이아웃의 탭 아래에 두고, Vs 탭에서만 보인다.
 * 이름만 있는 드롭다운 2단계: 분류(초기 로스터 / 시즌 1~4)를 고른 뒤 그 분류의 캐릭터를 고른다.
 * 분류만 고르면 그 분류의 공략 전체를 본다. 이름 옆에 공략 수.
 */
export function VsOpponentPicker({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const pathname = usePathname();
  const group = useVsGroup();
  const opponent = useVsOpponent();
  const counts = useVsCounts();
  if (!pathname.endsWith("/vs")) return null;

  const withCount = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);
  const sum = (slugs: string[]) => slugs.reduce((n, slug) => n + (counts[slug] ?? 0), 0);
  const inGroup = (id: RosterGroup) => ROSTER.filter((c) => c.group === id);
  const groupName = (id: RosterGroup) => pickLocalized(ROSTER_GROUPS.find((g) => g.id === id)!.name, locale).text;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-border bg-surface px-4 py-2.5">
      <span className="eyebrow shrink-0">{dict.vs.opponent}</span>
      <div className="flex min-w-0 flex-1 gap-2">
        <select
          aria-label={dict.vs.opponent}
          value={group ?? ""}
          onChange={(e) => setVsGroup((e.target.value || null) as RosterGroup | null)}
          className={SELECT_CLASS}
        >
          <option value="">{withCount(dict.vs.all, sum(Object.keys(counts)))}</option>
          {ROSTER_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {withCount(groupName(g.id), sum(inGroup(g.id).map((c) => c.slug)))}
            </option>
          ))}
        </select>
        <select
          aria-label={dict.vs.opponent}
          value={opponent ?? ""}
          disabled={!group}
          onChange={(e) => setVsOpponent(e.target.value || null)}
          className={SELECT_CLASS}
        >
          {group ? (
            <>
              <option value="">{withCount(`${groupName(group)} ${dict.vs.all}`, sum(inGroup(group).map((c) => c.slug)))}</option>
              {inGroup(group).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {withCount(pickLocalized(c.name, locale).text, counts[c.slug] ?? 0)}
                </option>
              ))}
            </>
          ) : (
            <option value="">—</option>
          )}
        </select>
      </div>
    </div>
  );
}
