"use client";

import { lazy, Suspense, useState } from "react";
import { useAdmin } from "./admin-context";

const ReorderPanel = lazy(() => import("./reorder-panel"));

/** 콤보·셋업 목록의 '순서 변경' 버튼. 이 캐릭터를 편집할 수 있는 관리자에게만 보인다. */
export function ReorderButton({
  table,
  characterId,
  label,
}: {
  table: "combos" | "setups" | "vs_guides" | "moves" | "videos";
  characterId: number;
  label: string;
}) {
  const { canEdit } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!canEdit(characterId)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="skew border border-accent px-4 py-1.5 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-accent-fg"
      >
        <span>⇅ 순서 변경</span>
      </button>
      {open && (
        <Suspense>
          <ReorderPanel table={table} characterId={characterId} label={label} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
