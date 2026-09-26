"use client";

import { lazy, Suspense, useState } from "react";
import { useAdmin } from "./admin-context";

const MoveImportPanel = lazy(() => import("./move-import-panel"));

/** 커맨드 리스트의 '표 붙여넣기' 버튼. 이 캐릭터를 편집할 수 있는 관리자에게만 보인다. */
export function MoveImportButton({ characterId, characterName }: { characterId: number; characterName: string }) {
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
        <span>표 붙여넣기</span>
      </button>
      {open && (
        <Suspense>
          <MoveImportPanel characterId={characterId} characterName={characterName} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
