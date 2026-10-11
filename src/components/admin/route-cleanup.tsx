"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Combo, Localized } from "@/lib/types";
import { comboRoutes, routesToColumns } from "@/lib/combo-routes";
import { splitRoutes, type SplitResult } from "@/lib/route-split";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { SplitPreview } from "./routes-input";

type Candidate = { combo: Combo; result: SplitResult };

/**
 * 루트 정리 팝업: 이 캐릭터의 콤보 중 같은 중간 루트를 반복해 적은 콤보를 찾아
 * '공통 루트 + 마무리 여러 개'로 한꺼번에 바꾼다 (콤보마다 나누기 전 → 나눈 후를 보고 고른다).
 * 저장은 콤보마다 updated_at 을 비교해, 그사이 다른 관리자가 고친 콤보는 건너뛴다.
 */
export default function RouteCleanup({ characterId, onClose }: { characterId: number; onClose: () => void }) {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { bumpData } = useAdmin();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    sb.from("combos")
      .select("*")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data, error }) => {
        if (error) setMessage(describeError(error));
        const list = ((data ?? []) as Combo[])
          .map((combo) => ({ combo, result: splitRoutes(comboRoutes(combo)) }))
          .filter((c) => c.result.groups.length > 0 || c.result.skipped.length > 0);
        setCandidates(list);
        // 나눌 수 있는 콤보는 처음부터 골라 둔다
        setSelected(new Set(list.filter((c) => c.result.groups.length > 0).map((c) => c.combo.id)));
      });
  }, [sb, characterId, reload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function apply(targets: Candidate[]) {
    if (targets.length === 0) return;
    if (!confirm(`콤보 ${targets.length}개의 루트를 마무리로 나눌까요?`)) return;
    setBusy(true);
    setMessage(null);
    const failed: string[] = [];
    let done = 0;
    for (const { combo, result } of targets) {
      const columns = routesToColumns(result.routes);
      const title = (combo.title as Localized | null)?.ko ?? `#${combo.id}`;
      if (typeof columns === "string") {
        failed.push(`${title} (루트를 만들 수 없음)`);
        continue;
      }
      let query = sb.from("combos").update(columns).eq("id", combo.id);
      if (combo.updated_at) query = query.eq("updated_at", combo.updated_at);
      const { data, error } = await query.select("id");
      if (error) failed.push(`${title} (${describeError(error)})`);
      else if (!data?.length) failed.push(`${title} (그사이 고쳐졌거나 권한 없음)`);
      else done++;
    }
    if (done > 0) await revalidateSite(sb, { characters: [characterId] });
    setBusy(false);
    setMessage(`${done}개를 나눴습니다.${failed.length ? ` 실패: ${failed.join(", ")}` : ""}`);
    bumpData();
    router.refresh();
    setReload((n) => n + 1);
  }

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ready = (candidates ?? []).filter((c) => c.result.groups.length > 0);
  const chosen = ready.filter((c) => selected.has(c.combo.id));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="루트 정리"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col border border-highlight bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-highlight-text!">Routes</span>
          <h2 className="display text-2xl">루트 정리</h2>
          <button type="button" onClick={onClose} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>
        <p className="border-b border-border px-5 py-2 text-xs text-muted">
          같은 중간 루트를 반복해서 적은 콤보를 &lsquo;공통 루트 + 마무리 여러 개&rsquo;로 바꿉니다. 루트마다 적은 데미지 · 후상황 ·
          엔더 · 메모는 해당 마무리로 옮깁니다. 비공개 콤보도 포함합니다.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {candidates === null ? (
            <p className="text-sm text-muted">불러오는 중…</p>
          ) : candidates.length === 0 ? (
            <p className="border border-dashed border-border py-8 text-center text-sm text-muted">나눌 콤보가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {candidates.map(({ combo, result }) => {
                const routes = comboRoutes(combo);
                const can = result.groups.length > 0;
                return (
                  <li key={combo.id} className="flex flex-col gap-2 border border-border bg-surface-2 p-3">
                    <label className="flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        disabled={!can}
                        checked={selected.has(combo.id)}
                        onChange={() => toggle(combo.id)}
                        className="size-4 accent-[var(--highlight)]"
                      />
                      {(combo.title as Localized | null)?.ko ?? `#${combo.id}`}
                      {!combo.is_published && (
                        <span className="border border-accent/60 px-1.5 text-[0.65rem] font-bold text-accent">비공개</span>
                      )}
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="text-xs font-bold text-muted">지금</span>
                        <ol className="flex flex-col gap-0.5 font-mono text-xs">
                          {routes.map((r, i) => (
                            <li key={i}>
                              <span className="text-muted">{i + 1}. </span>
                              {r.classic}
                              {r.finishes.length > 0 && <span className="text-highlight-text"> + 마무리 {r.finishes.length}개</span>}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-muted">나눈 뒤</span>
                        <SplitPreview result={result} />
                      </div>
                    </div>
                    {can && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => apply([{ combo, result }])}
                        className="self-end border border-highlight/60 px-3 py-1 text-xs font-bold text-highlight-text hover:bg-highlight hover:text-highlight-fg disabled:opacity-40"
                      >
                        이 콤보만 적용
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2 px-5 py-3">
          {message && <p className="text-sm text-highlight-text">{message}</p>}
          <button type="button" onClick={onClose} className="ml-auto px-3 py-1.5 text-sm text-muted hover:text-fg">
            닫기
          </button>
          <button
            type="button"
            onClick={() => apply(chosen)}
            disabled={busy || chosen.length === 0}
            className="skew bg-highlight px-5 py-1.5 text-sm font-bold text-highlight-fg disabled:opacity-50"
          >
            <span>{busy ? "적용 중…" : `선택한 ${chosen.length}개 적용`}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
