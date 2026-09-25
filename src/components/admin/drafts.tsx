"use client";

import { useEffect, useState } from "react";
import { EditButton, useAdmin } from "./admin-context";
import { NotationText } from "../notation";

type Draft = { id: number; title: { ko: string } | null; notation_classic: string; created_date: string };

/**
 * 관리자에게만 보이는 비공개 콤보 목록.
 * 정적 페이지에는 공개 항목만 들어가므로 비공개 항목은 브라우저에서 직접 불러온다.
 */
export function DraftCombos({ characterId }: { characterId: number }) {
  const { canEdit, dataVersion } = useAdmin();
  const isAdmin = canEdit(characterId);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    import("@/lib/supabase/browser").then(({ supabaseBrowser }) =>
      supabaseBrowser()
        .from("combos")
        .select("id,title,notation_classic,created_date")
        .eq("character_id", characterId)
        .eq("is_published", false)
        .order("sort_order")
        .then(({ data }) => setDrafts(data ?? [])),
    );
  }, [isAdmin, characterId, dataVersion]);

  if (!isAdmin || drafts.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border border-dashed border-accent/60 p-3">
      <p className="eyebrow text-accent!">비공개 ({drafts.length}) — 관리자에게만 보임</p>
      <ul className="flex flex-col divide-y divide-border">
        {drafts.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2">
            <span className="font-semibold">{d.title?.ko}</span>
            <span className="min-w-0 truncate text-sm text-muted">
              <NotationText notation={d.notation_classic} />
            </span>
            <span className="ml-auto">
              <EditButton entity="combo" id={d.id} scope={characterId} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
