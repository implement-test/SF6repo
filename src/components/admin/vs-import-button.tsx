"use client";

import { lazy, Suspense, useState } from "react";
import { useAdmin } from "./admin-context";

const VsImportPanel = lazy(() => import("./vs-import-panel"));

/** Vs 가이드 탭의 '다른 가이드에서 가져오기'. 이 캐릭터를 편집할 수 있는 관리자에게만 보인다. */
export function VsImportButton({
  characterId,
  characterName,
  opponent,
}: {
  characterId: number;
  characterName: string;
  opponent: string | null;
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
        <span>다른 가이드에서 가져오기</span>
      </button>
      {open && (
        <Suspense>
          <VsImportPanel
            characterId={characterId}
            characterName={characterName}
            opponent={opponent}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
