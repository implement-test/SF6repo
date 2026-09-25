"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLE_LABELS, describeError, getAdminInfo, supabaseBrowser } from "@/lib/supabase/browser";
import type { Patch } from "@/lib/types";
import { formatPatchVersion } from "@/lib/patch";
import { ADMIN_FLAG, AddButton, EditButton, useAdmin } from "./admin-context";
import { AdminSection } from "./admin-section";
import { AdminUsers } from "./admin-users";
import { DeletedItems } from "./deleted-items";

type Status = "loading" | "signed-out" | "not-admin" | "admin";

/** /admin: 로그인, 내 계정, 관리자 관리, 패치, 삭제된 항목 */
export function AdminConsole() {
  const sb = supabaseBrowser();
  const { admin, isManager, recheck } = useAdmin();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      if (!data.session) return setStatus("signed-out");
      setEmail(data.session.user.email ?? null);
      const info = await getAdminInfo(sb);
      if (cancelled) return;
      setStatus(info ? "admin" : "not-admin");
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, admin]);

  async function signOut() {
    await sb.auth.signOut();
    localStorage.removeItem(ADMIN_FLAG);
    recheck();
    setStatus("signed-out");
  }

  if (status === "loading" || (status === "admin" && !admin)) return <p className="text-muted">확인 중…</p>;
  if (status === "signed-out") return <LoginForm onSignedIn={() => recheck()} />;

  if (status === "not-admin" || !admin) {
    return (
      <div className="flex flex-col items-start gap-3 border border-warn/40 bg-warn/10 p-5">
        <p className="font-semibold text-warn">{email} 계정은 관리자로 등록되어 있지 않습니다.</p>
        <p className="text-sm text-muted">최고 관리자 또는 부 관리자에게 등록을 요청하세요.</p>
        <button type="button" onClick={signOut} className="text-sm font-semibold underline">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <MyAccount onSignOut={signOut} />
      {isManager && <AdminUsers />}
      {isManager && <PatchManager />}
      <DeletedItems />
    </div>
  );
}

function MyAccount({ onSignOut }: { onSignOut: () => void }) {
  const sb = supabaseBrowser();
  const { admin, recheck, bumpData } = useAdmin();
  const [name, setName] = useState(admin?.displayName ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [characters, setCharacters] = useState<{ id: number; slug: string; name: { ko: string } }[]>([]);

  useEffect(() => {
    sb.from("characters")
      .select("id,slug,name")
      .order("sort_order")
      .then(({ data }) => setCharacters(data ?? []));
  }, [sb]);

  if (!admin) return null;
  const mine = admin.role === "character" ? characters.filter((c) => admin.characterIds.includes(c.id)) : characters;

  async function saveName() {
    const { error } = await sb.from("admins").update({ display_name: name.trim() }).eq("user_id", admin!.userId);
    setMessage(error ? describeError(error) : "저장했습니다.");
    if (!error) {
      recheck();
      bumpData();
    }
  }

  return (
    <div className="flex flex-col gap-4 border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="skew bg-accent px-2 py-0.5 text-xs font-bold text-accent-fg">
          <span>{ROLE_LABELS[admin.role]}</span>
        </span>
        <span className="text-sm">{admin.email}</span>
        <Link href="/" className="ml-auto text-sm font-semibold text-accent hover:underline">
          사이트로 이동 →
        </Link>
        <button type="button" onClick={onSignOut} className="text-sm font-semibold text-muted hover:text-fg">
          로그아웃
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">표시 이름 (작성자로 공개됩니다)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-64 border border-border-strong bg-inset px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <button type="button" onClick={saveName} className="skew bg-accent px-4 py-1.5 text-sm font-bold text-accent-fg">
          <span>저장</span>
        </button>
        {message && <span className="text-sm text-muted">{message}</span>}
      </div>
      {!admin.displayName && <p className="text-sm text-warn">표시 이름을 정해 주세요. 비어 있으면 작성자가 표시되지 않습니다.</p>}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-semibold text-muted">
          {admin.role === "character" ? "담당 캐릭터" : "편집 가능: 모든 캐릭터"}
        </span>
        {mine.map((c) => (
          <Link key={c.id} href={`/${c.slug}`} className="border border-border-strong px-2 py-0.5 hover:border-accent hover:text-accent">
            {c.name.ko}
          </Link>
        ))}
        {admin.role === "character" && mine.length === 0 && <span className="text-muted">아직 배정된 캐릭터가 없습니다.</span>}
      </div>
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
    if (!(await getAdminInfo(sb))) {
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
    <AdminSection title="패치" eyebrow="Patches" action={<AddButton entity="patch" label="패치 추가" />}>
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
    </AdminSection>
  );
}
