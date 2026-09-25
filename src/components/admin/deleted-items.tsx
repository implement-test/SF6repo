"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { AdminSection } from "./admin-section";
import { useAuthorNames, type ChangeEntry } from "./history";

/** 복구할 수 있는 콘텐츠 테이블 */
const TABLE_LABELS: Record<string, string> = {
  overview_sections: "개요",
  moves: "커맨드",
  combos: "콤보",
  setups: "셋업",
  practice_settings: "프랙티스 세팅",
  vs_punishes: "확정 반격",
  vs_patterns: "패턴 대응",
  glossary: "용어",
  patches: "패치",
};

function summarize(data: Record<string, unknown> | null): string {
  if (!data) return "";
  const pick = (v: unknown) => (v && typeof v === "object" && "ko" in v ? String((v as { ko: string }).ko) : null);
  return (
    pick(data.title) ??
    pick(data.name) ??
    pick(data.term) ??
    (typeof data.version === "string" ? data.version : null) ??
    (typeof data.notation_classic === "string" ? data.notation_classic : null) ??
    `#${data.id}`
  );
}

/**
 * 최근 삭제된 항목과 복구. 복구 권한은 DB(RLS)가 판단한다
 * (캐릭터 관리자는 맡은 캐릭터의 항목만 복구된다).
 */
export function DeletedItems() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { dataVersion, bumpData } = useAdmin();
  const authors = useAuthorNames();
  const [entries, setEntries] = useState<ChangeEntry[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    sb.from("change_log")
      .select("*")
      .eq("action", "delete")
      .in("table_name", Object.keys(TABLE_LABELS))
      .order("changed_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setEntries(data ?? []));
  }, [sb, dataVersion]);

  async function restore(entry: ChangeEntry) {
    if (!entry.old_data) return;
    setMessage(null);
    const { error } = await sb.from(entry.table_name).insert(entry.old_data);
    if (error) {
      setMessage(error.code === "23505" ? "이미 복구된 항목입니다." : describeError(error));
      return;
    }
    await revalidateSite(sb);
    setMessage(`'${summarize(entry.old_data)}'을(를) 복구했습니다.`);
    bumpData();
    router.refresh();
  }

  return (
    <AdminSection title="삭제된 항목" eyebrow="Trash">
      <p className="text-sm text-muted">최근 삭제된 30개입니다. 복구하면 삭제 전 내용 그대로 되돌아옵니다.</p>
      {message && <p className="text-sm text-accent">{message}</p>}
      {entries === null ? (
        <p className="text-muted">불러오는 중…</p>
      ) : entries.length === 0 ? (
        <p className="border border-dashed border-border py-8 text-center text-muted">삭제된 항목이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <span className="border border-border-strong px-1.5 py-0.5 text-xs text-muted">{TABLE_LABELS[e.table_name]}</span>
              <span className="min-w-0 truncate font-semibold">{summarize(e.old_data)}</span>
              <span className="text-xs text-muted">
                {e.changed_by ? (authors.get(e.changed_by) ?? "이름 없음") : "시스템"} · {new Date(e.changed_at).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => restore(e)}
                className="ml-auto text-sm font-semibold text-accent hover:underline"
              >
                복구
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}
