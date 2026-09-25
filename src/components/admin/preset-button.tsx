"use client";

import { lazy, Suspense, useState } from "react";
import { useAdmin } from "./admin-context";

const PresetManager = lazy(() => import("./preset-manager"));

/** 캐릭터 페이지의 '시동기 프리셋' 버튼. 이 캐릭터를 편집할 수 있는 관리자에게만 보인다. */
export function PresetButton({ characterId, characterName }: { characterId: number; characterName: string }) {
  const { canEdit } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!canEdit(characterId)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="skew border border-accent px-3 py-1 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-accent-fg"
      >
        <span>시동기 프리셋</span>
      </button>
      {open && (
        <Suspense>
          <PresetManager characterId={characterId} characterName={characterName} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
