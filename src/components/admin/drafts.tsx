"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
 * 관리자에게만 보이는 비공개 항목 목록 (커맨드, 콤보, 셋업, Vs 가이드).
 * 정적 페이지에는 공개 항목만 들어가므로 비공개 항목은 브라우저에서 직접 불러온다.
 * 하나씩 또는 모두 한 번에 공개할 수 있다.
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
  const { canEdit, dataVersion, bumpData } = useAdmin();
  const router = useRouter();
  const isAdmin = canEdit(characterId);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 공개로 바꾼다 (ids 가 여러 개면 한 번 확인) */
  async function publish(ids: number[]) {
    if (ids.length === 0) return;
    if (ids.length > 1 && !confirm(`비공개 ${label} ${ids.length}개를 모두 공개할까요?`)) return;
    setBusy(true);
    setError(null);
    const { supabaseBrowser, revalidateSite, describeError } = await import("@/lib/supabase/browser");
    const sb = supabaseBrowser();
    const { data, error } = await sb.from(table).update({ is_published: true }).in("id", ids).select("id");
    if (error || !data?.length) {
      setBusy(false);
      setError(error ? describeError(error) : "공개할 권한이 없습니다.");
      return;
    }
    await revalidateSite(sb);
    setBusy(false);
    bumpData();
    router.refresh();
  }

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
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow text-accent!">
          비공개 {label} ({drafts.length}) — 관리자에게만 보임
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => publish(drafts.map((d) => d.id))}
          className="skew ml-auto bg-accent px-3 py-1 text-xs font-bold text-accent-fg disabled:opacity-50"
        >
          <span>{busy ? "공개하는 중…" : `모두 공개 (${drafts.length})`}</span>
        </button>
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
      {/* 항목이 많으면 목록 안에서 스크롤 */}
      <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
        {drafts.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2">
            <span className="font-semibold">{d.title?.ko}</span>
            {d.notation_classic && (
              <span className="min-w-0 truncate text-sm text-muted">
                <NotationText notation={d.notation_classic} />
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => publish([d.id])}
                className="border border-highlight/60 px-2 py-1 text-xs font-bold text-highlight-text hover:bg-highlight hover:text-highlight-fg disabled:opacity-40"
              >
                공개
              </button>
              <EditButton entity={entity} id={d.id} scope={characterId} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
