"use client";

import { useEffect, useState } from "react";
import type { Localized } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { inputClass } from "./starters-input";

/** 콤보 편집 창의 그룹 고르기. 그룹을 만들고 이름을 바꾸는 것은 '순서 · 그룹' 창에서 한다 */
export function ComboGroupSelect({
  label,
  help,
  value,
  onChange,
  characterId,
}: {
  label: string;
  help?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  characterId: number | undefined;
}) {
  const [groups, setGroups] = useState<{ id: number; name: Localized }[] | null>(null);

  useEffect(() => {
    if (characterId === undefined) return;
    supabaseBrowser()
      .from("combo_groups")
      .select("id,name")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data }) => setGroups((data ?? []) as { id: number; name: Localized }[]));
  }, [characterId]);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className={inputClass}
      >
        <option value="">그룹 없음</option>
        {(groups ?? []).map((g) => (
          <option key={g.id} value={g.id}>
            {g.name.ko}
          </option>
        ))}
      </select>
      {help && <span className="text-xs text-muted">{help}</span>}
    </label>
  );
}
