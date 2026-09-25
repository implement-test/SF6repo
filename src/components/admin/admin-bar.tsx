"use client";

import Link from "next/link";
import { ROLE_LABELS, supabaseBrowser } from "@/lib/supabase/browser";
import { ADMIN_FLAG, useAdmin } from "./admin-context";

/** 관리자 모드일 때 화면 아래에 떠 있는 표시줄 */
export default function AdminBar() {
  const { admin, recheck } = useAdmin();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    localStorage.removeItem(ADMIN_FLAG);
    recheck();
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 border border-accent bg-bg-deep/95 p-1 shadow-lg shadow-black/40 backdrop-blur">
      <span className="skew bg-accent px-2 py-0.5 text-xs font-bold text-accent-fg">
        <span>{admin ? ROLE_LABELS[admin.role] : "ADMIN"}</span>
      </span>
      {admin?.displayName && <span className="px-1.5 text-xs text-muted">{admin.displayName}</span>}
      <Link href="/admin" className="px-2 py-0.5 text-xs font-semibold text-muted hover:text-fg">
        관리
      </Link>
      <button type="button" onClick={signOut} className="px-2 py-0.5 text-xs font-semibold text-muted hover:text-fg">
        로그아웃
      </button>
    </div>
  );
}
