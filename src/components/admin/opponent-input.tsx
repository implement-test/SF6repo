"use client";

import { useState } from "react";
import { ROSTER, ROSTER_GROUPS, rosterBySlug, type RosterGroup } from "@/lib/roster";
import { inputClass } from "./starters-input";

/**
 * Vs 가이드 편집 창의 상대 캐릭터: 방문자 화면과 같은 2단계 드롭다운.
 * 분류(초기 로스터 / 시즌 1~4)를 고른 뒤 그 분류의 캐릭터를 고른다. 분류를 바꾸면 캐릭터 선택은 풀린다.
 */
export function OpponentInput({ value, onChange }: { value: string | null; onChange: (slug: string | null) => void }) {
  const [pickedGroup, setPickedGroup] = useState<RosterGroup | null>(null);
  // 고른 캐릭터가 있으면 그 캐릭터의 분류, 없으면 마지막으로 고른 분류
  const group = (value && rosterBySlug(value)?.group) || pickedGroup;

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        aria-label="상대 분류"
        value={group ?? ""}
        onChange={(e) => {
          setPickedGroup((e.target.value || null) as RosterGroup | null);
          onChange(null);
        }}
        className={inputClass}
      >
        <option value="">분류 선택</option>
        {ROSTER_GROUPS.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name.ko}
          </option>
        ))}
      </select>
      <select
        aria-label="상대 캐릭터"
        value={value ?? ""}
        disabled={!group}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${inputClass} disabled:opacity-50`}
      >
        <option value="">{group ? "캐릭터 선택" : "—"}</option>
        {ROSTER.filter((c) => c.group === group).map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name.ko}
          </option>
        ))}
      </select>
    </div>
  );
}
