"use client";

import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { EntityType } from "@/lib/admin/entities";

/**
 * 관리자 모드 상태.
 * 방문자에게는 Supabase 클라이언트도, 편집기 코드도 내려가지 않도록
 * 로그인 때 남긴 표시(ADMIN_FLAG)가 있을 때만 동적으로 불러온다.
 */

export const ADMIN_FLAG = "sf6r:admin";

export type EditorRequest = {
  entity: EntityType;
  id?: number;
  defaults?: Record<string, unknown>;
};

type AdminState = {
  isAdmin: boolean;
  openEditor: (req: EditorRequest) => void;
  /** 로그인/로그아웃 뒤 상태를 다시 확인한다 */
  recheck: () => void;
  /** 저장할 때마다 1씩 늘어난다. 브라우저에서 직접 불러오는 목록은 이 값이 바뀌면 다시 불러온다. */
  dataVersion: number;
  bumpData: () => void;
};

const AdminContext = createContext<AdminState>({
  isAdmin: false,
  openEditor: () => {},
  recheck: () => {},
  dataVersion: 0,
  bumpData: () => {},
});

export const useAdmin = () => useContext(AdminContext);

const EditorPanel = lazy(() => import("./editor-panel"));
const AdminBar = lazy(() => import("./admin-bar"));

function hasFlag() {
  try {
    return localStorage.getItem(ADMIN_FLAG) === "1";
  } catch {
    return false;
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editor, setEditor] = useState<EditorRequest | null>(null);
  const [nonce, setNonce] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!hasFlag()) return;
    let cancelled = false;
    import("@/lib/supabase/browser").then(async ({ supabaseBrowser, checkIsAdmin }) => {
      const ok = await checkIsAdmin(supabaseBrowser());
      if (cancelled) return;
      setIsAdmin(ok);
      // 세션이 만료됐으면 표시를 지워 다음부터는 불러오지 않는다.
      if (!ok) localStorage.removeItem(ADMIN_FLAG);
    });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const openEditor = useCallback((req: EditorRequest) => setEditor(req), []);
  const recheck = useCallback(() => {
    // 로그아웃으로 표시가 지워졌으면 바로 관리자 모드를 끈다.
    if (!hasFlag()) setIsAdmin(false);
    setNonce((n) => n + 1);
  }, []);
  const bumpData = useCallback(() => setDataVersion((n) => n + 1), []);

  return (
    <AdminContext.Provider value={{ isAdmin, openEditor, recheck, dataVersion, bumpData }}>
      {children}
      {isAdmin && (
        <Suspense>
          <AdminBar />
          {editor && <EditorPanel key={`${editor.entity}-${editor.id ?? "new"}`} request={editor} onClose={() => setEditor(null)} />}
        </Suspense>
      )}
    </AdminContext.Provider>
  );
}

/** 관리자에게만 보이는 수정 버튼 */
export function EditButton({ entity, id, label = "수정" }: { entity: EntityType; id: number; label?: string }) {
  const { isAdmin, openEditor } = useAdmin();
  if (!isAdmin) return null;
  return (
    <button
      type="button"
      onClick={() => openEditor({ entity, id })}
      title={label}
      aria-label={label}
      className="inline-grid size-7 place-items-center border border-border-strong text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden>
        <path d="M11.8 1.5a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L6 12.7 2.5 13.5l.8-3.5 8.5-8.5ZM3 14.5h11v1H3z" />
      </svg>
    </button>
  );
}

/** 관리자에게만 보이는 추가 버튼 */
export function AddButton({
  entity,
  defaults,
  label,
}: {
  entity: EntityType;
  defaults?: Record<string, unknown>;
  label: string;
}) {
  const { isAdmin, openEditor } = useAdmin();
  if (!isAdmin) return null;
  return (
    <button
      type="button"
      onClick={() => openEditor({ entity, defaults })}
      className="skew bg-accent px-4 py-1.5 text-sm font-bold text-accent-fg transition-opacity hover:opacity-90"
    >
      <span>+ {label}</span>
    </button>
  );
}
