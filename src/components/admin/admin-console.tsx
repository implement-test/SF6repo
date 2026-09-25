"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkIsAdmin, supabaseBrowser } from "@/lib/supabase/browser";
import type { Patch } from "@/lib/types";
import { ADMIN_FLAG, AddButton, EditButton, useAdmin } from "./admin-context";
import { formatPatchVersion } from "@/lib/patch";

type Status = "loading" | "signed-out" | "not-admin" | "admin";

/** /admin: 로그인과 사이트 공통 데이터(패치) 관리 */
export function AdminConsole() {
  const sb = supabaseBrowser();
  const { recheck, isAdmin } = useAdmin();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      if (!data.session) return setStatus("signed-out");
      setEmail(data.session.user.email ?? null);
      const ok = await checkIsAdmin(sb);
      if (cancelled) return;
      setStatus(ok ? "admin" : "not-admin");
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, isAdmin]);

  async function signOut() {
    await sb.auth.signOut();
    localStorage.removeItem(ADMIN_FLAG);
    recheck();
    setStatus("signed-out");
  }

  if (status === "loading") return <p className="text-muted">확인 중…</p>;
  if (status === "signed-out") return <LoginForm onSignedIn={() => recheck()} />;

  if (status === "not-admin") {
    return (
      <div className="flex flex-col items-start gap-3 border border-warn/40 bg-warn/10 p-5">
        <p className="font-semibold text-warn">{email} 계정은 관리자로 등록되어 있지 않습니다.</p>
        <p className="text-sm text-muted">Supabase SQL Editor 에서 admins 테이블에 이 계정을 추가하세요 (docs/SETUP.md).</p>
        <button type="button" onClick={signOut} className="text-sm font-semibold underline">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3 border border-border bg-surface px-4 py-3">
        <span className="skew bg-accent px-2 py-0.5 text-xs font-bold text-accent-fg">
          <span>ADMIN</span>
        </span>
        <span className="text-sm">{email}</span>
        <span className="text-sm text-muted">— 사이트 곳곳에 수정/추가 버튼이 표시됩니다.</span>
        <Link href="/" className="ml-auto text-sm font-semibold text-accent hover:underline">
          사이트로 이동 →
        </Link>
        <button type="button" onClick={signOut} className="text-sm font-semibold text-muted hover:text-fg">
          로그아웃
        </button>
      </div>
      <PatchManager />
    </div>
  );
}

function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.");
      return;
    }
    if (!(await checkIsAdmin(sb))) {
      await sb.auth.signOut();
      setBusy(false);
      setError("관리자로 등록되지 않은 계정입니다.");
      return;
    }
    localStorage.setItem(ADMIN_FLAG, "1");
    onSignedIn();
  }

  const input = "w-full border border-border-strong bg-inset px-3 py-2 outline-none focus:border-accent";
  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-4 border border-border bg-surface p-6">
      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Email</span>
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button type="submit" disabled={busy} className="skew mt-1 bg-accent py-2 font-bold text-accent-fg disabled:opacity-50">
        <span>{busy ? "로그인 중…" : "로그인"}</span>
      </button>
    </form>
  );
}

function PatchManager() {
  const sb = supabaseBrowser();
  const { dataVersion } = useAdmin();
  const [patches, setPatches] = useState<Patch[] | null>(null);

  useEffect(() => {
    sb.from("patches")
      .select("*")
      .order("released_on", { ascending: false })
      .then(({ data }) => setPatches(data ?? []));
  }, [sb, dataVersion]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end gap-3 border-b border-border pb-2">
        <h2 className="display text-2xl">패치</h2>
        <span className="eyebrow pb-0.5">Patches</span>
        <div className="ml-auto">
          <AddButton entity="patch" label="패치 추가" />
        </div>
      </div>
      <p className="text-sm text-muted">
        가장 최근 적용일의 패치가 &lsquo;최신&rsquo;입니다. 기준 패치가 최신이 아닌 항목에는 &lsquo;이전 패치 기준&rsquo; 배지가 붙습니다.
      </p>
      {patches === null ? (
        <p className="text-muted">불러오는 중…</p>
      ) : patches.length === 0 ? (
        <p className="border border-dashed border-border py-8 text-center text-muted">등록된 패치가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {patches.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="display text-lg">{formatPatchVersion(p.version)}</span>
              {i === 0 && (
                <span className="skew bg-highlight px-2 py-0.5 text-xs font-bold text-highlight-fg">
                  <span>LATEST</span>
                </span>
              )}
              <span className="text-sm text-muted">{p.released_on}</span>
              <span className="ml-auto">
                <EditButton entity="patch" id={p.id} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
