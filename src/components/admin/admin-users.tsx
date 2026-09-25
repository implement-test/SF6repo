"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS, describeError, supabaseBrowser, type AdminRole } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { AdminSection } from "./admin-section";

type AdminRow = {
  user_id: string;
  email: string;
  role: AdminRole;
  display_name: string;
  character_ids: number[];
};
type CharacterOption = { id: number; name: { ko: string } };

const input = "border border-border-strong bg-inset px-2.5 py-1.5 text-sm outline-none focus:border-accent";

/**
 * 관리자 목록과 임명/해임.
 *   최고 관리자: 부 관리자·캐릭터 관리자 관리
 *   부 관리자:   캐릭터 관리자만 관리
 * 권한 검사는 DB(RLS·트리거)가 하고, 화면은 할 수 있는 동작만 보여 준다.
 */
export function AdminUsers() {
  const sb = supabaseBrowser();
  const { admin, dataVersion, bumpData } = useAdmin();
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    sb.rpc("list_admins").then(({ data }) => setRows(data ?? []));
    sb.from("characters")
      .select("id,name")
      .order("sort_order")
      .then(({ data }) => setCharacters(data ?? []));
  }, [sb, dataVersion]);

  if (!admin) return null;
  const assignableRoles: AdminRole[] = admin.role === "super" ? ["sub", "character"] : ["character"];
  const canManage = (row: AdminRow) =>
    row.user_id !== admin.userId &&
    ((admin.role === "super" && row.role !== "super") || (admin.role === "sub" && row.role === "character"));
  const charName = (id: number) => characters.find((c) => c.id === id)?.name.ko ?? `#${id}`;

  function done() {
    setEditing(null);
    setAdding(false);
    bumpData();
  }

  return (
    <AdminSection
      title="관리자"
      eyebrow="Admins"
      action={
        !adding && (
          <button type="button" onClick={() => setAdding(true)} className="skew bg-accent px-4 py-1.5 text-sm font-bold text-accent-fg">
            <span>+ 관리자 추가</span>
          </button>
        )
      }
    >
      <p className="text-sm text-muted">
        계정은 Supabase 대시보드(Authentication → Users)에서 먼저 만든 뒤, 여기서 이메일로 찾아 역할을 지정합니다.
        {admin.role === "sub" && " 부 관리자는 캐릭터 관리자만 추가·수정·해임할 수 있습니다."}
      </p>

      {adding && (
        <AdminForm
          characters={characters}
          roles={assignableRoles}
          onCancel={() => setAdding(false)}
          onDone={done}
        />
      )}

      {rows === null ? (
        <p className="text-muted">불러오는 중…</p>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {rows.map((row) =>
            editing === row.user_id ? (
              <li key={row.user_id} className="p-3">
                <AdminForm
                  characters={characters}
                  roles={assignableRoles}
                  existing={row}
                  onCancel={() => setEditing(null)}
                  onDone={done}
                />
              </li>
            ) : (
              <li key={row.user_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                <span
                  className={`skew px-2 py-0.5 text-xs font-bold ${row.role === "character" ? "border border-border-strong text-muted" : "bg-accent text-accent-fg"}`}
                >
                  <span>{ROLE_LABELS[row.role]}</span>
                </span>
                <span className="font-semibold">{row.display_name || "(이름 없음)"}</span>
                <span className="text-sm text-muted">{row.email}</span>
                {row.role === "character" && (
                  <span className="text-sm text-muted">
                    · {row.character_ids.length ? row.character_ids.map(charName).join(", ") : "배정된 캐릭터 없음"}
                  </span>
                )}
                {row.user_id === admin.userId && <span className="text-xs text-accent">(나)</span>}
                {canManage(row) && (
                  <button
                    type="button"
                    onClick={() => setEditing(row.user_id)}
                    className="ml-auto text-sm font-semibold text-accent hover:underline"
                  >
                    수정
                  </button>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </AdminSection>
  );
}

function AdminForm({
  characters,
  roles,
  existing,
  onCancel,
  onDone,
}: {
  characters: CharacterOption[];
  roles: AdminRole[];
  existing?: AdminRow;
  onCancel: () => void;
  onDone: () => void;
}) {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState(existing?.email ?? "");
  const [name, setName] = useState(existing?.display_name ?? "");
  const [role, setRole] = useState<AdminRole>(existing?.role ?? roles[roles.length - 1]);
  const [charIds, setCharIds] = useState<number[]>(existing?.character_ids ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const fail = (msg: string) => {
      setBusy(false);
      setError(msg);
    };

    let userId = existing?.user_id;
    if (!userId) {
      const { data, error } = await sb.rpc("find_user_id_by_email", { p_email: email });
      if (error) return fail(describeError(error));
      if (!data) return fail("이 이메일의 계정이 없습니다. Supabase 대시보드에서 먼저 계정을 만드세요.");
      userId = data as string;
      const { error: insertError } = await sb.from("admins").insert({ user_id: userId, role, display_name: name.trim() });
      if (insertError) {
        return fail(insertError.code === "23505" ? "이미 관리자로 등록된 계정입니다." : describeError(insertError));
      }
    } else {
      const { error: updateError } = await sb
        .from("admins")
        .update({ role, display_name: name.trim() })
        .eq("user_id", userId);
      if (updateError) return fail(describeError(updateError));
    }

    // 담당 캐릭터 맞추기 (캐릭터 관리자만 의미가 있다)
    const wanted = role === "character" ? charIds : [];
    const before = existing?.character_ids ?? [];
    const removed = before.filter((id) => !wanted.includes(id));
    const added = wanted.filter((id) => !before.includes(id));
    if (removed.length) {
      const { error } = await sb.from("admin_characters").delete().eq("user_id", userId).in("character_id", removed);
      if (error) return fail(describeError(error));
    }
    if (added.length) {
      const { error } = await sb.from("admin_characters").insert(added.map((character_id) => ({ user_id: userId, character_id })));
      if (error) return fail(describeError(error));
    }
    onDone();
  }

  async function revoke() {
    if (!existing || !confirm(`${existing.display_name || existing.email} 님의 관리자 권한을 해임할까요?\n계정 자체는 남아 있으며, 다시 추가할 수 있습니다.`))
      return;
    setBusy(true);
    const { data, error } = await sb.from("admins").delete().eq("user_id", existing.user_id).select("user_id");
    if (error || !data?.length) {
      setBusy(false);
      setError(error ? describeError(error) : "해임할 권한이 없습니다.");
      return;
    }
    onDone();
  }

  return (
    <div className="flex flex-col gap-3 border border-accent/50 bg-surface-2 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!existing}
            className={`${input} disabled:opacity-60`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">표시 이름</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">역할</span>
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={input} disabled={roles.length === 1}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {role === "character" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">담당 캐릭터 (여러 개 선택 가능)</span>
          <div className="flex flex-wrap gap-1">
            {characters.map((c) => {
              const on = charIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCharIds(on ? charIds.filter((id) => id !== c.id) : [...charIds, c.id])}
                  className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
                >
                  <span>{c.name.ko}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-warn">{error}</p>}
      <div className="flex items-center gap-2">
        {existing && (
          <button
            type="button"
            onClick={revoke}
            disabled={busy}
            className="border border-warn/50 px-3 py-1.5 text-sm font-semibold text-warn hover:bg-warn/10 disabled:opacity-50"
          >
            해임
          </button>
        )}
        <button type="button" onClick={onCancel} className="ml-auto px-3 py-1.5 text-sm font-semibold text-muted hover:text-fg">
          취소
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy || (!existing && !email.trim())}
          className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
        >
          <span>{busy ? "저장 중…" : existing ? "저장" : "추가"}</span>
        </button>
      </div>
    </div>
  );
}
