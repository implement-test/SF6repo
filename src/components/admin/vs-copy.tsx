"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { ROSTER, ROSTER_GROUPS } from "@/lib/roster";
import type { Localized } from "@/lib/types";
import { useAdmin } from "./admin-context";

type CharacterRow = { id: number; name: Localized; sort_order: number };

/** 편집할 수 있는 캐릭터 목록 (사이트에 페이지가 있는 캐릭터 중) */
export function useEditableCharacters(): CharacterRow[] {
  const { canEdit } = useAdmin();
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  useEffect(() => {
    supabaseBrowser()
      .from("characters")
      .select("id,name,sort_order")
      .order("sort_order")
      .then(({ data }) => setCharacters((data ?? []) as CharacterRow[]));
  }, []);
  return characters.filter((c) => canEdit(c.id));
}

const opponentLabel = (slug: string) => {
  const r = ROSTER.find((c) => c.slug === slug);
  const group = r && ROSTER_GROUPS.find((g) => g.id === r.group);
  return r ? `${r.name.ko}${group ? ` (${group.name.ko})` : ""}` : slug;
};

/**
 * Vs 가이드 편집 창의 '다른 캐릭터로 복사'.
 * 예: 류 vs 테리 의 '2HK 딜캐' 를 고우키 vs 테리 로. 상대도 바꿀 수 있다 (기본은 그대로).
 */
export function VsCopyTo({
  currentCharacterId,
  opponent,
  disabled,
  onCopy,
}: {
  currentCharacterId: number;
  opponent: string;
  disabled?: boolean;
  onCopy: (characterId: number, opponent: string) => void;
}) {
  const characters = useEditableCharacters();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number | "">("");
  const [targetOpponent, setTargetOpponent] = useState(opponent);
  const choices = characters.filter((c) => c.id !== currentCharacterId);

  return (
    <span className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title="이 내용을 다른 캐릭터의 Vs 가이드로 복사합니다 (저장해야 만들어집니다)"
        className="border border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50"
      >
        다른 캐릭터로
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-2 flex w-72 flex-col gap-2 border border-accent bg-surface p-3 shadow-2xl">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            내 캐릭터
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-border-strong bg-inset px-2 py-1.5 text-sm text-fg"
            >
              <option value="">— 고르세요</option>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.ko}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            상대
            <select
              value={targetOpponent}
              onChange={(e) => setTargetOpponent(e.target.value)}
              className="border border-border-strong bg-inset px-2 py-1.5 text-sm text-fg"
            >
              {ROSTER.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {opponentLabel(c.slug)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={target === ""}
            onClick={() => target !== "" && onCopy(target, targetOpponent)}
            className="skew bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-40"
          >
            <span>복사해서 새 항목 열기</span>
          </button>
        </div>
      )}
    </span>
  );
}
