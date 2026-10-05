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
 * 스위치는 화면에서만 바뀌고, '적용'을 누르면 바뀐 캐릭터만 한꺼번에 저장한다.
 * 끄면 홈의 캐릭터 목록에서 빠지고 캐릭터 페이지가 열리지 않는다 (관리자도 사이트에서는 볼 수 없으니, 내용을 고칠 때는 잠시 켠다).
 */
export function CharacterVisibility() {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { admin } = useAdmin();
  const [rows, setRows] = useState<CharacterRow[] | null>(null);
  /** 저장된 공개 상태 (바뀐 것만 저장하기 위해) */
  const [saved, setSaved] = useState<Map<number, boolean>>(new Map());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSuper = admin?.role === "super";

  useEffect(() => {
    if (!isSuper) return;
    sb.from("characters")
      .select("id,slug,name,is_published")
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) setError(describeError(error));
        const list = (data ?? []) as CharacterRow[];
        setRows(list);
        setSaved(new Map(list.map((r) => [r.id, r.is_published])));
      });
  }, [sb, isSuper]);

  if (!isSuper) return null;

  const changed = rows?.filter((r) => saved.get(r.id) !== r.is_published) ?? [];

  function toggle(id: number) {
    setNotice(null);
    setRows((list) => list?.map((r) => (r.id === id ? { ...r, is_published: !r.is_published } : r)) ?? null);
  }

  function setAll(value: boolean) {
    setNotice(null);
    setRows((list) => list?.map((r) => ({ ...r, is_published: value })) ?? null);
  }

  /** 바뀐 캐릭터만 공개 / 비공개로 나눠 한 번씩 저장하고, 사이트를 한 번 새로 만든다 */
  async function apply() {
    if (changed.length === 0) return;
    setSaving(true);
    setError(null);
    for (const value of [true, false]) {
      const ids = changed.filter((r) => r.is_published === value).map((r) => r.id);
      if (ids.length === 0) continue;
      const { error } = await sb.from("characters").update({ is_published: value }).in("id", ids);
      if (error) {
        setSaving(false);
        setError(describeError(error));
        return;
      }
    }
    setSaved(new Map(rows!.map((r) => [r.id, r.is_published])));
    await revalidateSite(sb);
    router.refresh();
    setSaving(false);
    setNotice(`${changed.length}명의 공개 설정을 적용했습니다.`);
  }

  function reset() {
    setNotice(null);
    setRows((list) => list?.map((r) => ({ ...r, is_published: saved.get(r.id) ?? r.is_published })) ?? null);
  }

  const published = rows?.filter((r) => r.is_published).length ?? 0;

  return (
    <AdminSection title="캐릭터 공개" eyebrow="Characters">
      <p className="text-sm text-muted">
        끄면 홈의 캐릭터 목록에서 빠지고 캐릭터 페이지가 열리지 않습니다. 원하는 만큼 켜고 끈 뒤 “적용”을 누르세요. 최고 관리자만 바꿀 수 있습니다.
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
                disabled={saving}
                onClick={() => toggle(r.id)}
                className={`flex w-full items-center gap-2 border bg-surface-2 px-3 py-2 text-left transition-colors hover:border-border-strong disabled:opacity-60 ${saved.get(r.id) !== r.is_published ? "border-highlight" : r.is_published ? "border-accent/60" : "border-border"}`}
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
                  {r.is_published ? "공개" : "비공개"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            disabled={saving}
            className="border border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50"
          >
            모두 공개
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            disabled={saving}
            className="border border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent disabled:opacity-50"
          >
            모두 비공개
          </button>
          <span className="ml-auto text-sm text-muted">
            {changed.length > 0 ? `바뀐 캐릭터 ${changed.length}명 (노란 테두리)` : (notice ?? "")}
          </span>
          <button
            type="button"
            onClick={reset}
            disabled={saving || changed.length === 0}
            className="px-3 py-1.5 text-sm font-semibold text-muted hover:text-fg disabled:opacity-40"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={saving || changed.length === 0}
            className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
          >
            <span>{saving ? "적용 중…" : "적용"}</span>
          </button>
        </div>
      )}
    </AdminSection>
  );
}
