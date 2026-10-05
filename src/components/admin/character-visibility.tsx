"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Localized } from "@/lib/types";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { AdminSection } from "./admin-section";

type CharacterRow = { id: number; slug: string; name: Localized; is_published: boolean };

/**
 * 캐릭터 공개 On/Off (최고 관리자만, DB 트리거로도 막는다 — 0026).
 * 끄면 홈의 캐릭터 목록에서 빠지고 캐릭터 페이지가 열리지 않는다 (관리자도 사이트에서는 볼 수 없으니, 내용을 고칠 때는 잠시 켠다).
 */
export function CharacterVisibility() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { admin } = useAdmin();
  const [rows, setRows] = useState<CharacterRow[] | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSuper = admin?.role === "super";

  useEffect(() => {
    if (!isSuper) return;
    sb.from("characters")
      .select("id,slug,name,is_published")
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) setError(describeError(error));
        setRows((data ?? []) as CharacterRow[]);
      });
  }, [sb, isSuper]);

  if (!isSuper) return null;

  async function toggle(row: CharacterRow) {
    setSaving(row.id);
    setError(null);
    const next = !row.is_published;
    const { error } = await sb.from("characters").update({ is_published: next }).eq("id", row.id);
    if (error) {
      setSaving(null);
      setError(describeError(error));
      return;
    }
    setRows((list) => list?.map((r) => (r.id === row.id ? { ...r, is_published: next } : r)) ?? null);
    await revalidateSite(sb);
    router.refresh();
    setSaving(null);
  }

  const published = rows?.filter((r) => r.is_published).length ?? 0;

  return (
    <AdminSection title="캐릭터 공개" eyebrow="Characters">
      <p className="text-sm text-muted">
        끄면 홈의 캐릭터 목록에서 빠지고 캐릭터 페이지가 열리지 않습니다. 최고 관리자만 바꿀 수 있습니다.
        {rows && (
          <span className="ml-2 font-semibold text-fg">
            공개 {published} / {rows.length}
          </span>
        )}
      </p>
      {error && <p className="text-sm text-warn">{error}</p>}
      {rows === null ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="switch"
                aria-checked={r.is_published}
                disabled={saving !== null}
                onClick={() => toggle(r)}
                className="flex w-full items-center gap-2 border border-border bg-surface-2 px-3 py-2 text-left transition-colors hover:border-border-strong disabled:opacity-60 aria-checked:border-accent/60"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.name.ko}</span>
                <span
                  aria-hidden
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${r.is_published ? "bg-accent" : "bg-border-strong"}`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${r.is_published ? "left-[1.125rem]" : "left-0.5"}`}
                  />
                </span>
                <span className={`w-10 text-right text-xs font-bold ${r.is_published ? "text-accent" : "text-muted"}`}>
                  {saving === r.id ? "…" : r.is_published ? "공개" : "비공개"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}
