"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";

export type ChangeEntry = {
  id: number;
  table_name: string;
  row_id: string;
  action: "insert" | "update" | "delete";
  changed_by: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

const ACTION_LABELS = { insert: "작성", update: "수정", delete: "삭제" } as const;

/** 관리자 user_id → 표시 이름 */
export function useAuthorNames(): Map<string, string> {
  const { dataVersion } = useAdmin();
  const [names, setNames] = useState(new Map<string, string>());
  useEffect(() => {
    supabaseBrowser()
      .from("author_names")
      .select("user_id,display_name")
      .then(({ data }) =>
        setNames(new Map((data ?? []).filter((a) => a.display_name).map((a) => [a.user_id, a.display_name]))),
      );
  }, [dataVersion]);
  return names;
}

/** 저장할 때 바뀐 칸 이름 (updated_at 같은 기록용 칸은 뺀다) */
export function changedKeys(entry: ChangeEntry): string[] {
  if (entry.action !== "update" || !entry.old_data || !entry.new_data) return [];
  const skip = new Set(["updated_at", "updated_by"]);
  return Object.keys(entry.new_data).filter(
    (k) => !skip.has(k) && JSON.stringify(entry.old_data![k]) !== JSON.stringify(entry.new_data![k]),
  );
}

/** 한 항목의 변경 이력. 각 시점의 내용을 폼으로 불러올 수 있다. */
export function History({
  table,
  rowId,
  authors,
  onLoad,
}: {
  table: string;
  rowId: string;
  authors: Map<string, string>;
  onLoad: (snapshot: Record<string, unknown>) => void;
}) {
  const [entries, setEntries] = useState<ChangeEntry[] | null>(null);

  useEffect(() => {
    supabaseBrowser()
      .from("change_log")
      .select("*")
      .eq("table_name", table)
      .eq("row_id", rowId)
      .order("changed_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setEntries(data ?? []));
  }, [table, rowId]);

  if (!entries) return <p className="text-sm text-muted">이력 불러오는 중…</p>;
  if (entries.length === 0) return <p className="text-sm text-muted">기록된 이력이 없습니다.</p>;

  return (
    <ol className="flex flex-col divide-y divide-border border border-border bg-inset text-sm">
      {entries.map((e, i) => {
        const keys = changedKeys(e);
        const snapshot = e.new_data;
        return (
          <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
            <span className="font-semibold">{ACTION_LABELS[e.action]}</span>
            <span className="text-muted">{e.changed_by ? (authors.get(e.changed_by) ?? "이름 없음") : "시스템"}</span>
            <span className="text-xs text-muted">{new Date(e.changed_at).toLocaleString()}</span>
            {keys.length > 0 && <span className="w-full text-xs text-muted">바뀐 칸: {keys.join(", ")}</span>}
            {i > 0 && snapshot && (
              <button
                type="button"
                onClick={() => onLoad(snapshot)}
                className="ml-auto text-xs font-semibold text-accent hover:underline"
              >
                이 시점으로 불러오기
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
