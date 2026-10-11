"use client";

import { Suspense, useState } from "react";
import { lazyWithReload } from "./lazy-reload";
import { useAdmin } from "./admin-context";

const RouteCleanup = lazyWithReload(() => import("./route-cleanup"));

/** 콤보 목록의 '루트 정리' 버튼. 이 캐릭터를 편집할 수 있는 관리자에게만 보인다. */
export function RouteCleanupButton({ characterId }: { characterId: number }) {
  const { canEdit } = useAdmin();
  const [open, setOpen] = useState(false);
  if (!canEdit(characterId)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="같은 중간 루트를 반복해 적은 콤보를 공통 루트 + 마무리로 정리합니다"
        className="skew border border-highlight/70 px-4 py-1.5 text-sm font-bold text-highlight-text transition-colors hover:bg-highlight hover:text-highlight-fg"
      >
        <span>루트 정리</span>
      </button>
      {open && (
        <Suspense>
          <RouteCleanup characterId={characterId} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
