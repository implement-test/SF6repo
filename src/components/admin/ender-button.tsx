"use client";

import { Suspense, useState } from "react";
import { lazyWithReload } from "./lazy-reload";
import { useAdmin } from "./admin-context";

const EnderManager = lazyWithReload(() => import("./ender-manager"));

/** 콤보 · 셋업 목록의 '엔더 관리' 버튼. 이 캐릭터를 편집할 수 있는 관리자에게만 보인다. */
export function EnderButton({ characterId }: { characterId: number }) {
  const { canEdit } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!canEdit(characterId)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="skew border border-highlight/70 px-4 py-1.5 text-sm font-bold text-highlight-text transition-colors hover:bg-highlight hover:text-highlight-fg"
      >
        <span>엔더 관리</span>
      </button>
      {open && (
        <Suspense>
          <EnderManager characterId={characterId} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
