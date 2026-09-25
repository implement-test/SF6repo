"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { NotationText } from "../notation";

type Item = {
  id: number;
  title: { ko: string } | null;
  notation_classic: string | null;
  is_published: boolean;
  sort_order: number;
};

/**
 * 콤보·셋업 순서 변경 팝업. 끌어서 놓거나 ▲▼ 로 옮기고, 저장하면 위에서부터 0, 1, 2 … 로 매긴다.
 * 순서만 바꾼 수정은 최근 수정자·변경 이력에 남지 않는다 (0011_reorder_quiet.sql).
 */
export default function ReorderPanel({
  table,
  characterId,
  label,
  onClose,
}: {
  table: "combos" | "setups";
  characterId: number;
  label: string;
  onClose: () => void;
}) {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { bumpData } = useAdmin();
  const [items, setItems] = useState<Item[] | null>(null);
  const [original, setOriginal] = useState<number[]>([]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from(table)
      .select("id,title,notation_classic,is_published,sort_order")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id")
      .then(({ data, error }) => {
        if (error) setError(describeError(error));
        const list = (data ?? []) as Item[];
        setItems(list);
        setOriginal(list.map((i) => i.id));
      });
  }, [sb, table, characterId]);

  const dirty = !!items && items.some((item, i) => item.id !== original[i]);

  function close() {
    if (dirty && !confirm("바꾼 순서를 저장하지 않고 닫을까요?")) return;
    onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function moveTo(from: number, to: number) {
    if (!items || to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setItems(next);
  }

  async function save() {
    if (!items) return;
    setBusy(true);
    setError(null);
    const results = await Promise.all(
      items.map((item, idx) =>
        item.sort_order === idx ? null : sb.from(table).update({ sort_order: idx }).eq("id", item.id).select("id"),
      ),
    );
    const failed = results.find((r) => r && (r.error || !r.data?.length));
    if (failed) {
      setBusy(false);
      setError(failed.error ? describeError(failed.error) : "순서를 바꿀 권한이 없습니다.");
      return;
    }
    await revalidateSite(sb);
    bumpData();
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={close} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${label} 순서 변경`}
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col border border-accent bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-accent!">Order</span>
          <h2 className="display text-2xl">{label} 순서</h2>
          <button type="button" onClick={close} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>
        <p className="border-b border-border px-5 py-2 text-xs text-muted">
          ⠿ 를 잡고 끌어서 옮기거나 ▲▼ 버튼을 누르세요. 위에 있을수록 먼저 보입니다.
        </p>

        <ol className="min-h-0 flex-1 overflow-y-auto p-3">
          {items === null && <li className="px-2 py-2 text-sm text-muted">불러오는 중…</li>}
          {items?.length === 0 && <li className="px-2 py-2 text-sm text-muted">아직 {label}이(가) 없습니다.</li>}
          {items?.map((item, i) => (
            <li
              key={item.id}
              draggable
              onDragStart={(e) => {
                setDragId(item.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId === null || dragId === item.id) return;
                moveTo(
                  items.findIndex((x) => x.id === dragId),
                  i,
                );
              }}
              onDragEnd={() => setDragId(null)}
              data-dragging={dragId === item.id}
              className="group mb-1.5 flex items-center gap-3 border border-border bg-surface-2 px-2 py-2 transition-colors hover:border-border-strong data-[dragging=true]:border-accent data-[dragging=true]:opacity-60"
            >
              <span aria-hidden className="cursor-grab select-none px-1 text-lg leading-none text-muted active:cursor-grabbing">
                ⠿
              </span>
              <span className="display w-6 text-right text-base text-muted tabular-nums">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{item.title?.ko || `#${item.id}`}</span>
                  {!item.is_published && (
                    <span className="shrink-0 border border-accent/60 px-1.5 text-[0.65rem] font-bold text-accent">비공개</span>
                  )}
                </span>
                {item.notation_classic && (
                  <span className="truncate text-xs text-muted">
                    <NotationText notation={item.notation_classic} />
                  </span>
                )}
              </div>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveTo(i, i - 1)}
                  className="grid size-7 place-items-center border border-border-strong text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-30"
                  aria-label="위로"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === items.length - 1}
                  onClick={() => moveTo(i, i + 1)}
                  className="grid size-7 place-items-center border border-border-strong text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-30"
                  aria-label="아래로"
                >
                  ▼
                </button>
              </span>
            </li>
          ))}
        </ol>

        <footer className="flex items-center gap-2 border-t border-border bg-surface-2 px-5 py-3">
          {error && <p className="text-sm text-warn">{error}</p>}
          <button type="button" onClick={close} className="ml-auto px-3 py-1.5 text-sm text-muted hover:text-fg">
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !dirty}
            className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
          >
            <span>{busy ? "저장 중…" : "순서 저장"}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
