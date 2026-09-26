"use client";

import { useEffect, useState } from "react";
import type { EntityType } from "@/lib/admin/entities";
import { EditButton, useAdmin } from "./admin-context";
import { NotationText } from "../notation";

/**
 * 관리자 목록(비공개 항목, 순서 변경)에 보여 줄 칸: 제목과 대표 표기.
 * 표마다 칸 이름이 달라서 이름을 맞춰 읽는다 (커맨드: name → title, input_classic → notation_classic).
 */
export function listColumns(table: string): string {
  if (table === "moves") return "id,title:name,notation_classic:input_classic";
  if (table === "vs_guides") return "id,title";
  return "id,title,notation_classic";
}

type Draft = { id: number; title: { ko: string } | null; notation_classic: string | null };

/**
 * 관리자에게만 보이는 비공개 항목 목록 (콤보, 셋업 …).
 * 정적 페이지에는 공개 항목만 들어가므로 비공개 항목은 브라우저에서 직접 불러온다.
 */
export function DraftItems({
  table,
  entity,
  characterId,
  label,
}: {
  table: string;
  entity: EntityType;
  characterId: number;
  label: string;
}) {
  const { canEdit, dataVersion } = useAdmin();
  const isAdmin = canEdit(characterId);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    import("@/lib/supabase/browser").then(({ supabaseBrowser }) =>
      supabaseBrowser()
        .from(table)
        .select(listColumns(table))
        .eq("character_id", characterId)
        .eq("is_published", false)
        .order("sort_order")
        // 칸 이름을 표마다 바꿔 읽어서 타입을 직접 맞춘다
        .then(({ data }) => setDrafts((data ?? []) as unknown as Draft[])),
    );
  }, [isAdmin, table, characterId, dataVersion]);

  if (!isAdmin || drafts.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border border-dashed border-accent/60 p-3">
      <p className="eyebrow text-accent!">
        비공개 {label} ({drafts.length}) — 관리자에게만 보임
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {drafts.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2">
            <span className="font-semibold">{d.title?.ko}</span>
            {d.notation_classic && (
              <span className="min-w-0 truncate text-sm text-muted">
                <NotationText notation={d.notation_classic} />
              </span>
            )}
            <span className="ml-auto">
              <EditButton entity={entity} id={d.id} scope={characterId} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
