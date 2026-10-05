"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Localized } from "@/lib/types";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import { useAdmin } from "./admin-context";
import { NotationText } from "../notation";

type ComboRow = {
  id: number;
  title: Localized | null;
  notation_classic: string | null;
  is_published: boolean;
  sort_order: number;
  group_id: number | null;
};
type GroupRow = { id: number; name: Localized; sort_order: number };

/** 편집 중인 그룹. 새 그룹은 id 가 없다 (key 로 구분) */
type Group = { key: string; id: number | null; name: Localized };
/** 그룹(key, null = 그룹 없음)마다 콤보 id 순서 */
type Layout = Map<string | null, number[]>;

const keyOf = (id: number) => `g${id}`;
let newKey = 0;

const smallButton =
  "grid size-7 place-items-center border border-border-strong text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-30";

/**
 * 콤보 순서 · 그룹 편집 팝업.
 * 그룹 없는 콤보가 맨 위, 그 아래 그룹 순서대로 보인다. 콤보는 끌어서 다른 그룹으로 옮기거나,
 * ▲▼ 로 그룹 경계를 넘어 옮기거나, 오른쪽 목록에서 그룹을 고른다.
 * 그룹은 이름을 바꾸고, ▲▼ 로 순서를 바꾸고, 지울 수 있다 (지운 그룹의 콤보는 그룹 없음으로).
 * 순서 · 그룹만 바꾼 수정은 최근 수정자 · 변경 이력에 남지 않는다 (0021).
 */
export default function ComboReorderPanel({ characterId, onClose }: { characterId: number; onClose: () => void }) {
  const sb = supabaseBrowser();
  const router = useRouter();
  const { bumpData } = useAdmin();
  const [combos, setCombos] = useState<Map<number, ComboRow> | null>(null);
  const [originalGroups, setOriginalGroups] = useState<GroupRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [layout, setLayout] = useState<Layout>(new Map());
  const [original, setOriginal] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, g] = await Promise.all([
        sb
          .from("combos")
          .select("id,title,notation_classic,is_published,sort_order,group_id")
          .eq("character_id", characterId)
          .order("sort_order")
          .order("id"),
        sb.from("combo_groups").select("id,name,sort_order").eq("character_id", characterId).order("sort_order").order("id"),
      ]);
      if (c.error || g.error) setError(describeError((c.error ?? g.error)!));
      const comboRows = (c.data ?? []) as ComboRow[];
      const groupRows = (g.data ?? []) as GroupRow[];
      const known = new Set(groupRows.map((x) => x.id));
      const next: Layout = new Map([[null, []]]);
      for (const row of groupRows) next.set(keyOf(row.id), []);
      for (const row of comboRows) {
        const key = row.group_id !== null && known.has(row.group_id) ? keyOf(row.group_id) : null;
        next.get(key)!.push(row.id);
      }
      const initialGroups = groupRows.map((row) => ({ key: keyOf(row.id), id: row.id, name: row.name }));
      setCombos(new Map(comboRows.map((row) => [row.id, row])));
      setOriginalGroups(groupRows);
      setGroups(initialGroups);
      setLayout(next);
      setOriginal(snapshot(initialGroups, next));
    })();
  }, [sb, characterId]);

  const dirty = !!combos && snapshot(groups, layout) !== original;

  function close() {
    if (dirty && !confirm("바꾼 순서를 저장하지 않고 닫을까요?")) return;
    onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const sectionKeys: (string | null)[] = [null, ...groups.map((g) => g.key)];

  /** 콤보를 section 의 index 자리로 옮긴다 */
  function place(id: number, section: string | null, index: number) {
    const next: Layout = new Map();
    for (const [key, ids] of layout) next.set(key, ids.filter((x) => x !== id));
    const target = next.get(section) ?? [];
    target.splice(Math.max(0, Math.min(index, target.length)), 0, id);
    next.set(section, target);
    setLayout(next);
  }

  function locate(id: number): { section: string | null; index: number } {
    for (const [section, ids] of layout) {
      const index = ids.indexOf(id);
      if (index >= 0) return { section, index };
    }
    return { section: null, index: 0 };
  }

  /** ▲▼: 그룹 안에서 한 칸, 그룹 끝에서는 앞뒤 그룹으로 넘어간다 */
  function step(id: number, dir: -1 | 1) {
    const { section, index } = locate(id);
    const ids = layout.get(section) ?? [];
    const s = sectionKeys.indexOf(section);
    if (dir === -1 && index > 0) return place(id, section, index - 1);
    if (dir === 1 && index < ids.length - 1) return place(id, section, index + 1);
    const neighbor = sectionKeys[s + dir];
    if (neighbor === undefined) return;
    place(id, neighbor, dir === -1 ? (layout.get(neighbor)?.length ?? 0) : 0);
  }

  function moveGroup(i: number, dir: -1 | 1) {
    const next = [...groups];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setGroups(next);
  }

  function addGroup() {
    const key = `new${++newKey}`;
    setGroups([...groups, { key, id: null, name: { ko: "" } }]);
    setLayout(new Map([...layout, [key, []]]));
  }

  function removeGroup(key: string) {
    const ids = layout.get(key) ?? [];
    if (ids.length > 0 && !confirm(`이 그룹을 지울까요? 안의 콤보 ${ids.length}개는 '그룹 없음'으로 옮겨집니다.`)) return;
    const next: Layout = new Map(layout);
    next.delete(key);
    next.set(null, [...(next.get(null) ?? []), ...ids]);
    setLayout(next);
    setGroups(groups.filter((g) => g.key !== key));
  }

  async function save() {
    if (!combos) return;
    const unnamed = groups.find((g) => !g.name.ko.trim());
    if (unnamed) return setError("그룹 이름(한국어)을 입력하세요.");
    setBusy(true);
    setError(null);
    const fail = (message: string) => {
      setBusy(false);
      setError(message);
    };

    // 1. 지운 그룹 (콤보는 DB 에서 그룹 없음이 된다)
    const kept = new Set(groups.map((g) => g.id).filter((id) => id !== null));
    const removed = originalGroups.filter((g) => !kept.has(g.id)).map((g) => g.id);
    if (removed.length > 0) {
      const { error } = await sb.from("combo_groups").delete().in("id", removed);
      if (error) return fail(describeError(error));
    }

    // 2. 새 그룹 · 이름이나 순서가 바뀐 그룹
    const ids = new Map<string, number>();
    for (const [i, g] of groups.entries()) {
      const name = cleanName(g.name);
      if (g.id === null) {
        const { data, error } = await sb
          .from("combo_groups")
          .insert({ character_id: characterId, name, sort_order: i })
          .select("id")
          .single();
        if (error || !data) return fail(error ? describeError(error) : "그룹을 만들 권한이 없습니다.");
        ids.set(g.key, data.id);
      } else {
        ids.set(g.key, g.id);
        const before = originalGroups.find((o) => o.id === g.id);
        if (before && before.sort_order === i && JSON.stringify(cleanName(before.name)) === JSON.stringify(name)) continue;
        const { error } = await sb.from("combo_groups").update({ name, sort_order: i }).eq("id", g.id);
        if (error) return fail(describeError(error));
      }
    }

    // 3. 콤보: 그룹 없음 → 그룹 순서대로 이어 붙여 0, 1, 2 … 로 매긴다
    const order = sectionKeys.flatMap((key) => (layout.get(key) ?? []).map((id) => ({ id, groupId: key === null ? null : ids.get(key)! })));
    const results = await Promise.all(
      order.map(({ id, groupId }, idx) => {
        const row = combos.get(id)!;
        if (row.sort_order === idx && row.group_id === groupId) return null;
        return sb.from("combos").update({ sort_order: idx, group_id: groupId }).eq("id", id).select("id");
      }),
    );
    const failed = results.find((r) => r && (r.error || !r.data?.length));
    if (failed) return fail(failed.error ? describeError(failed.error) : "순서를 바꿀 권한이 없습니다.");

    await revalidateSite(sb);
    bumpData();
    router.refresh();
    onClose();
  }

  const renderCombo = (id: number, section: string | null, index: number) => {
    const item = combos!.get(id)!;
    const first = section === null && index === 0;
    const last = section === sectionKeys[sectionKeys.length - 1] && index === (layout.get(section)?.length ?? 0) - 1;
    return (
      <li
        key={id}
        draggable
        onDragStart={(e) => {
          setDragId(id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragId === null || dragId === id) return;
          const box = e.currentTarget.getBoundingClientRect();
          const after = e.clientY > box.top + box.height / 2;
          const from = locate(dragId);
          // 같은 그룹에서 아래로 옮길 때는 자기 자리가 빠지는 만큼 한 칸 당긴다
          const shift = from.section === section && from.index < index ? -1 : 0;
          place(dragId, section, index + (after ? 1 : 0) + shift);
        }}
        onDragEnd={() => setDragId(null)}
        data-dragging={dragId === id}
        className="mb-1.5 flex items-center gap-3 border border-border bg-surface-2 px-2 py-2 transition-colors hover:border-border-strong data-[dragging=true]:border-accent data-[dragging=true]:opacity-60"
      >
        <span aria-hidden className="cursor-grab select-none px-1 text-lg leading-none text-muted active:cursor-grabbing">
          ⠿
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{item.title?.ko || `#${item.id}`}</span>
            {!item.is_published && (
              <span className="shrink-0 border border-accent/60 px-1.5 text-[0.65rem] font-bold text-accent">비공개</span>
            )}
          </span>
          {item.notation_classic && (
            <span className="truncate text-xs text-muted">
              <NotationText notation={item.notation_classic} />
            </span>
          )}
        </div>
        <select
          value={section ?? ""}
          onChange={(e) => place(id, e.target.value || null, Infinity)}
          aria-label="그룹"
          className="max-w-36 shrink-0 border border-border-strong bg-inset px-1.5 py-1 text-xs"
        >
          <option value="">그룹 없음</option>
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.name.ko || "(이름 없음)"}
            </option>
          ))}
        </select>
        <span className="flex shrink-0 gap-1">
          <button type="button" disabled={first} onClick={() => step(id, -1)} className={smallButton} aria-label="위로">
            ▲
          </button>
          <button type="button" disabled={last} onClick={() => step(id, 1)} className={smallButton} aria-label="아래로">
            ▼
          </button>
        </span>
      </li>
    );
  };

  /** 비어 있는 그룹에도 끌어다 놓을 수 있게 */
  const dropZone = (section: string | null) => (
    <li
      onDragOver={(e) => {
        e.preventDefault();
        if (dragId !== null) place(dragId, section, Infinity);
      }}
      className="border border-dashed border-border px-3 py-2 text-xs text-muted"
    >
      여기로 끌어다 놓기
    </li>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={close} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="콤보 순서 · 그룹"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col border border-accent bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-accent!">Order</span>
          <h2 className="display text-2xl">콤보 순서 · 그룹</h2>
          <button type="button" onClick={close} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>
        <p className="border-b border-border px-5 py-2 text-xs text-muted">
          ⠿ 를 잡고 끌어서 옮기거나(다른 그룹으로도), ▲▼ 를 누르거나, 오른쪽에서 그룹을 고르세요. 그룹 없는 콤보가 맨 위에 보입니다.
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {combos === null ? (
            <p className="text-sm text-muted">{error ?? "불러오는 중…"}</p>
          ) : (
            <div className="flex flex-col gap-5">
              {sectionKeys.map((section, s) => {
                const ids = layout.get(section) ?? [];
                const group = groups.find((g) => g.key === section);
                return (
                  <section key={section ?? "none"} className="flex flex-col gap-2">
                    {group ? (
                      <GroupHeader
                        group={group}
                        count={ids.length}
                        first={s === 1}
                        last={s === sectionKeys.length - 1}
                        onRename={(name) => setGroups(groups.map((g) => (g.key === group.key ? { ...g, name } : g)))}
                        onMove={(dir) => moveGroup(s - 1, dir)}
                        onRemove={() => removeGroup(group.key)}
                      />
                    ) : (
                      <h3 className="flex items-center gap-2 border-b border-border pb-1 text-sm font-bold text-muted">
                        그룹 없음 <span className="tabular-nums">{ids.length}</span>
                      </h3>
                    )}
                    <ol>
                      {ids.map((id, index) => renderCombo(id, section, index))}
                      {ids.length === 0 && dropZone(section)}
                    </ol>
                  </section>
                );
              })}
              <button
                type="button"
                onClick={addGroup}
                className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
              >
                + 그룹 추가
              </button>
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-border bg-surface-2 px-5 py-3">
          {error && combos && <p className="text-sm text-warn">{error}</p>}
          <button type="button" onClick={close} className="ml-auto px-3 py-1.5 text-sm text-muted hover:text-fg">
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !dirty}
            className="skew bg-accent px-5 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
          >
            <span>{busy ? "저장 중…" : "저장"}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function GroupHeader({
  group,
  count,
  first,
  last,
  onRename,
  onMove,
  onRemove,
}: {
  group: Group;
  count: number;
  first: boolean;
  last: boolean;
  onRename: (name: Localized) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [translations, setTranslations] = useState(false);
  const input = "border border-border-strong bg-inset px-2 py-1 text-sm outline-none focus:border-accent";
  return (
    <div className="flex flex-col gap-1.5 border-b-2 border-accent pb-1.5">
      <div className="flex items-center gap-2">
        <span className="eyebrow text-accent!">Group</span>
        <input
          value={group.name.ko}
          onChange={(e) => onRename({ ...group.name, ko: e.target.value })}
          placeholder="그룹 이름 (한국어, 필수)"
          className={`${input} min-w-0 flex-1 font-bold`}
        />
        <span className="text-xs text-muted tabular-nums">{count}</span>
        <button type="button" onClick={() => setTranslations(!translations)} className="text-xs font-semibold text-muted hover:text-accent">
          EN · JA
        </button>
        <button type="button" disabled={first} onClick={() => onMove(-1)} className={smallButton} aria-label="그룹 위로">
          ▲
        </button>
        <button type="button" disabled={last} onClick={() => onMove(1)} className={smallButton} aria-label="그룹 아래로">
          ▼
        </button>
        <button type="button" onClick={onRemove} className={`${smallButton} hover:border-warn! hover:text-warn!`} aria-label="그룹 삭제">
          ×
        </button>
      </div>
      {translations && (
        <div className="grid grid-cols-2 gap-2 pl-14">
          <input
            value={group.name.en ?? ""}
            onChange={(e) => onRename({ ...group.name, en: e.target.value })}
            placeholder="English (선택)"
            className={input}
          />
          <input
            value={group.name.ja ?? ""}
            onChange={(e) => onRename({ ...group.name, ja: e.target.value })}
            placeholder="日本語 (선택)"
            className={input}
          />
        </div>
      )}
    </div>
  );
}

/** 빈 번역은 뺀다 */
function cleanName(name: Localized): Localized {
  const out: Localized = { ko: name.ko.trim() };
  if (name.en?.trim()) out.en = name.en.trim();
  if (name.ja?.trim()) out.ja = name.ja.trim();
  return out;
}

/** 바뀐 것이 있는지 비교하기 위한 문자열 */
function snapshot(groups: Group[], layout: Layout): string {
  return JSON.stringify({
    groups: groups.map((g) => [g.key, g.name]),
    layout: [null, ...groups.map((g) => g.key)].map((key) => layout.get(key) ?? []),
  });
}
