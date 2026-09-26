"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { TargetLevel } from "@/lib/types";
import { useHiddenLevels } from "../use-hidden-levels";
import { useAdmin } from "./admin-context";

type Item = { id: number; level: TargetLevel; card: ReactNode };
type Status = { kind: "saving" | "saved" | "error"; message?: string } | null;

/**
 * 콤보·셋업 카드 목록. 편집 권한이 있는 관리자에게는 카드 왼쪽에 ▲ ⠿ ▼ 를 붙여
 * 목록에서 바로 순서를 바꾸게 한다 (옮기면 잠시 뒤 자동 저장).
 * 방문자에게는 그냥 카드 목록이다.
 *
 * 필터로 가려진 카드가 있어도 보이는 카드끼리 자리를 바꾸고, 비공개 항목의 자리는 그대로 둔다.
 */
export function SortableCards({
  table,
  characterId,
  items,
  visibleIds,
  className,
}: {
  table: "combos" | "setups" | "vs_guides" | "moves";
  characterId: number;
  /** 공개 항목 전체 (지금 순서대로) */
  items: Item[];
  /** 필터를 통과한 항목 */
  visibleIds: Set<number>;
  className: string;
}) {
  const { canEdit } = useAdmin();
  const router = useRouter();
  const editable = canEdit(characterId);
  const [order, setOrder] = useState<number[] | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<{ id: number; after: boolean } | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHidden = useHiddenLevels();

  // 서버에서 받은 순서가 바뀌면 (저장 후 새로 고침, '순서 변경' 창) 그 순서를 따른다
  const itemsKey = items.map((i) => i.id).join(",");
  const [seenKey, setSeenKey] = useState(itemsKey);
  if (seenKey !== itemsKey) {
    setSeenKey(itemsKey);
    setOrder(null);
  }

  // 옮긴 순서가 있으면 그 순서로. 새로 생긴 항목은 뒤에 붙인다.
  const byId = new Map(items.map((i) => [i.id, i]));
  const ids = order
    ? [...order.filter((id) => byId.has(id)), ...items.map((i) => i.id).filter((id) => !order.includes(id))]
    : items.map((i) => i.id);

  if (!editable) {
    // 대상 수준 숨김은 CSS 가 data-level 로 처리한다 (정적 페이지 그대로)
    return (
      <div className={className}>
        {ids
          .filter((id) => visibleIds.has(id))
          .map((id) => (
            <div key={id} data-level={byId.get(id)!.level}>
              {byId.get(id)!.card}
            </div>
          ))}
      </div>
    );
  }

  // 관리자 화면: 방문자 설정으로 숨긴 대상 수준의 카드는 아예 그리지 않아, ▲▼ 가 보이는 카드끼리 움직이게 한다
  const shown = ids.filter((id) => visibleIds.has(id) && !isHidden(byId.get(id)!.level));

  /** dragged 를 target 의 앞(after=false)이나 뒤로 옮긴다 */
  function move(dragged: number, target: number, after: boolean) {
    if (dragged === target) return;
    const next = ids.filter((id) => id !== dragged);
    const at = next.indexOf(target) + (after ? 1 : 0);
    next.splice(at, 0, dragged);
    setOrder(next);
    if (timer.current) clearTimeout(timer.current);
    setStatus({ kind: "saving" });
    timer.current = setTimeout(() => persist(next), 700);
  }

  async function persist(next: number[]) {
    const { supabaseBrowser, revalidateSite, describeError } = await import("@/lib/supabase/browser");
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from(table)
      .select("id,sort_order")
      .eq("character_id", characterId)
      .order("sort_order")
      .order("id");
    if (error || !data) return setStatus({ kind: "error", message: error ? describeError(error) : undefined });

    // 공개 항목이 있던 자리에 새 순서대로 채운다 (비공개 항목은 제자리)
    const rows = data as { id: number; sort_order: number }[];
    const moved = new Set(next);
    const queue = next.filter((id) => rows.some((r) => r.id === id));
    let k = 0;
    const full = rows.map((r) => (moved.has(r.id) ? queue[k++] : r.id));
    const current = new Map(rows.map((r) => [r.id, r.sort_order]));

    const results = await Promise.all(
      full.map((id, idx) =>
        current.get(id) === idx ? null : sb.from(table).update({ sort_order: idx }).eq("id", id).select("id"),
      ),
    );
    const failed = results.find((r) => r && (r.error || !r.data?.length));
    if (failed) {
      return setStatus({
        kind: "error",
        message: failed.error ? describeError(failed.error) : "순서를 바꿀 권한이 없습니다.",
      });
    }
    await revalidateSite(sb);
    router.refresh();
    setStatus({ kind: "saved" });
  }

  const railButton =
    "grid size-7 place-items-center border border-border-strong bg-surface text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="flex flex-col gap-2">
      {status && (
        <p
          role="status"
          className={`self-end text-xs font-semibold ${status.kind === "error" ? "text-warn" : status.kind === "saved" ? "text-highlight-text" : "text-muted"}`}
        >
          {status.kind === "saving" && "순서 저장 중…"}
          {status.kind === "saved" && "✓ 순서 저장됨"}
          {status.kind === "error" && `순서 저장 실패: ${status.message ?? "알 수 없는 오류"}`}
        </p>
      )}
      <div className={className}>
        {shown.map((id, i) => {
          const indicator = over?.id === id && dragId !== null && dragId !== id;
          return (
            <div
              key={id}
              draggable={armed === id}
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragId === null) return;
                e.preventDefault();
                const box = e.currentTarget.getBoundingClientRect();
                const after = e.clientY > box.top + box.height / 2;
                if (over?.id !== id || over.after !== after) setOver({ id, after });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId !== null && over) move(dragId, over.id, over.after);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOver(null);
                setArmed(null);
              }}
              data-dragging={dragId === id}
              className="relative flex items-stretch gap-2 data-[dragging=true]:opacity-40"
            >
              {indicator && (
                <span
                  aria-hidden
                  className={`absolute inset-x-0 z-10 h-[3px] bg-accent ${over.after ? "-bottom-[5px]" : "-top-[5px]"}`}
                />
              )}
              <div className="sticky top-20 flex shrink-0 flex-col items-center gap-1 self-start pt-3">
                <button
                  type="button"
                  className={railButton}
                  disabled={i === 0}
                  onClick={() => move(id, shown[i - 1], false)}
                  aria-label="위로"
                  title="위로"
                >
                  ▲
                </button>
                <span
                  onPointerDown={() => setArmed(id)}
                  onPointerUp={() => setArmed(null)}
                  className="grid h-9 w-7 cursor-grab select-none place-items-center text-lg leading-none text-muted hover:text-accent active:cursor-grabbing"
                  title="끌어서 옮기기"
                  aria-hidden
                >
                  ⠿
                </span>
                <button
                  type="button"
                  className={railButton}
                  disabled={i === shown.length - 1}
                  onClick={() => move(id, shown[i + 1], true)}
                  aria-label="아래로"
                  title="아래로"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">{byId.get(id)!.card}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
