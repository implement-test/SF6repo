"use client";

import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { EntityType } from "@/lib/admin/entities";
import type { AdminInfo } from "@/lib/supabase/browser";

/**
 * 관리자 모드 상태.
 * 방문자에게는 Supabase 클라이언트도, 편집기 코드도 내려가지 않도록
 * 로그인 때 남긴 표시(ADMIN_FLAG)가 있을 때만 동적으로 불러온다.
 *
 * 버튼 표시는 편의일 뿐이고, 실제 권한 검사는 DB(RLS)가 한다.
 */

export const ADMIN_FLAG = "sf6r:admin";

export type EditorRequest = {
  entity: EntityType;
  id?: number;
  /** 새로 만들 때 그대로 저장되는 숨은 칸 (character_id 등) */
  defaults?: Record<string, unknown>;
  /** 새로 만들 때 폼에 미리 채울 값 (복사하기). 저장은 폼 값으로 한다 */
  initial?: Record<string, unknown>;
};

/**
 * 저장하지 않은 편집 창의 내용. 입력하는 동안 브라우저(localStorage)에 저장해 두고,
 * 같은 항목의 창을 다시 열면 복원한다 — 창을 닫거나 새로 고치거나 페이지를 옮겨도 남는다.
 * 저장·삭제하거나 '처음부터 다시' 를 누르면 지우고, 7일이 지나면 버린다.
 */
export type EditorDraft = { values: Record<string, unknown>; initialLinks: number[]; baseUpdatedAt: string | null };

type StoredDraft = { draft: EditorDraft; savedAt: number };

const DRAFTS_KEY = "sf6r:editor-drafts";
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

function readDrafts(): Map<string, StoredDraft> {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "{}") as Record<string, StoredDraft>;
    const now = Date.now();
    return new Map(Object.entries(raw).filter(([, d]) => d && now - d.savedAt < DRAFT_TTL));
  } catch {
    return new Map();
  }
}

function writeDrafts(drafts: Map<string, StoredDraft>) {
  try {
    if (drafts.size === 0) localStorage.removeItem(DRAFTS_KEY);
    else localStorage.setItem(DRAFTS_KEY, JSON.stringify(Object.fromEntries(drafts)));
  } catch {
    // 저장소를 쓸 수 없으면 메모리에만 남는다
  }
}

/** 편집 창 하나를 가리키는 열쇠. 복사하기로 연 창은 기억하지 않는다 */
export function draftKey(req: EditorRequest): string | null {
  if (req.initial) return null;
  return `${req.entity}:${req.id ?? "new"}:${JSON.stringify(req.defaults ?? {})}`;
}

/**
 * 편집 대상이 속한 캐릭터.
 *   숫자 / 숫자 배열 → 그 캐릭터(들) 중 하나라도 맡고 있으면 편집 가능 (Vs 가이드는 [내 캐릭터, 상대])
 *   undefined        → 공통 데이터 (최고/부 관리자만)
 */
export type EditScope = number | number[] | undefined;

type AdminState = {
  admin: AdminInfo | null;
  isAdmin: boolean;
  isManager: boolean;
  canEdit: (scope: EditScope) => boolean;
  openEditor: (req: EditorRequest) => void;
  /** 로그인/로그아웃/권한 변경 뒤 상태를 다시 확인한다 */
  recheck: () => void;
  /** 저장할 때마다 1씩 늘어난다. 브라우저에서 직접 불러오는 목록은 이 값이 바뀌면 다시 불러온다. */
  dataVersion: number;
  bumpData: () => void;
  getDraft: (key: string) => EditorDraft | undefined;
  setDraft: (key: string, draft: EditorDraft) => void;
  clearDraft: (key: string) => void;
};

const AdminContext = createContext<AdminState>({
  admin: null,
  isAdmin: false,
  isManager: false,
  canEdit: () => false,
  openEditor: () => {},
  recheck: () => {},
  dataVersion: 0,
  bumpData: () => {},
  getDraft: () => undefined,
  setDraft: () => {},
  clearDraft: () => {},
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
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [editor, setEditor] = useState<{ req: EditorRequest; n: number } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!hasFlag()) return;
    let cancelled = false;
    import("@/lib/supabase/browser").then(async ({ supabaseBrowser, getAdminInfo }) => {
      try {
        const info = await getAdminInfo(supabaseBrowser());
        if (cancelled) return;
        setAdmin(info);
        // 세션이 만료됐거나 해임됐으면 표시를 지워 다음부터는 불러오지 않는다.
        if (!info) localStorage.removeItem(ADMIN_FLAG);
      } catch {
        // 일시적인 오류: 표시는 남겨 두고 이번에는 관리자 모드를 켜지 않는다.
        if (!cancelled) setAdmin(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const isManager = admin?.role === "super" || admin?.role === "sub";
  const canEdit = useCallback(
    (scope: EditScope) => {
      if (!admin) return false;
      if (admin.role === "super" || admin.role === "sub") return true;
      if (scope === undefined) return false;
      const ids = Array.isArray(scope) ? scope : [scope];
      return ids.some((id) => admin.characterIds.includes(id));
    },
    [admin],
  );

  // 여는 요청마다 번호를 붙여, 같은 종류의 '새 항목' 창을 연달아 열어도(복사하기) 새로 그려지게 한다.
  const openEditor = useCallback((req: EditorRequest) => setEditor((prev) => ({ req, n: (prev?.n ?? 0) + 1 })), []);
  const recheck = useCallback(() => {
    // 로그아웃으로 표시가 지워졌으면 바로 관리자 모드를 끈다.
    if (!hasFlag()) setAdmin(null);
    setNonce((n) => n + 1);
  }, []);
  const bumpData = useCallback(() => setDataVersion((n) => n + 1), []);

  // 작성 중이던 편집 창 내용. 브라우저에 저장해 새로 고쳐도 남는다 (저장소를 못 쓰면 메모리에만)
  const drafts = useRef<Map<string, StoredDraft> | null>(null);
  const store = useCallback(() => {
    if (!drafts.current) drafts.current = readDrafts();
    return drafts.current;
  }, []);
  const getDraft = useCallback((key: string) => store().get(key)?.draft, [store]);
  const setDraft = useCallback(
    (key: string, draft: EditorDraft) => {
      store().set(key, { draft, savedAt: Date.now() });
      writeDrafts(store());
    },
    [store],
  );
  const clearDraft = useCallback(
    (key: string) => {
      if (store().delete(key)) writeDrafts(store());
    },
    [store],
  );

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdmin: !!admin,
        isManager,
        canEdit,
        openEditor,
        recheck,
        dataVersion,
        bumpData,
        getDraft,
        setDraft,
        clearDraft,
      }}
    >
      {children}
      {admin && (
        <Suspense>
          <AdminBar />
          {editor && (
            <EditorPanel key={editor.n} request={editor.req} onClose={() => setEditor(null)} />
          )}
        </Suspense>
      )}
    </AdminContext.Provider>
  );
}

/** 편집 권한이 있는 관리자에게만 보이는 수정 버튼 */
export function EditButton({
  entity,
  id,
  scope,
  label = "수정",
}: {
  entity: EntityType;
  id: number;
  scope?: EditScope;
  label?: string;
}) {
  const { canEdit, openEditor } = useAdmin();
  if (!canEdit(scope)) return null;
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

/** 편집 권한이 있는 관리자에게만 보이는 추가 버튼 */
export function AddButton({
  entity,
  defaults,
  scope,
  label,
}: {
  entity: EntityType;
  defaults?: Record<string, unknown>;
  scope?: EditScope;
  label: string;
}) {
  const { canEdit, openEditor } = useAdmin();
  if (!canEdit(scope)) return null;
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
