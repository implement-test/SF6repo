"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import type { EntityType } from "@/lib/admin/entities";
import type { Localized, Patch } from "@/lib/types";
import { formatPatchVersion } from "@/lib/patch";
import { rosterBySlug } from "@/lib/roster";
import { EditButton, useAdmin } from "./admin-context";
import { AdminSection } from "./admin-section";
import { NotationText } from "../notation";

/** 기준 패치가 있는 콘텐츠 표 */
const KINDS = [
  { table: "combos", entity: "combo", label: "콤보", columns: "id,character_id,patch_id,title,notation_classic" },
  { table: "setups", entity: "setup", label: "셋업", columns: "id,character_id,patch_id,title,notation_classic" },
  { table: "moves", entity: "move", label: "커맨드", columns: "id,character_id,patch_id,title:name,notation_classic:input_classic" },
  { table: "vs_guides", entity: "vs", label: "Vs 가이드", columns: "id,character_id,patch_id,title,opponent" },
  { table: "character_overviews", entity: "overview", label: "개요", columns: "id,character_id,patch_id" },
] as const;

type Kind = (typeof KINDS)[number];
type Row = {
  id: number;
  character_id: number;
  patch_id: number | null;
  title?: Localized | null;
  notation_classic?: string | null;
  opponent?: string;
};
type Item = Row & { kind: Kind; key: string };
type CharacterRow = { id: number; slug: string; name: Localized; sort_order: number };

/** 이 항목이 보이는 페이지 (바로가기) */
function hrefFor(item: Item, slug: string): string {
  switch (item.kind.table) {
    case "combos":
      return `/${slug}/combos#combo-${item.id}`;
    case "setups":
      return `/${slug}/setups#setup-${item.id}`;
    case "moves":
      return `/${slug}/moves#move-${item.id}`;
    case "vs_guides":
      return `/${slug}/vs?vs=${item.opponent}#vs-${item.id}`;
    default:
      return `/${slug}`;
  }
}

/**
 * 패치 갱신: 기준 패치가 최신이 아닌(또는 비어 있는) 항목을 모아 보여 준다.
 * 내용을 확인하고 바꿀 게 없으면 '변경 없음' 으로 기준 패치만 최신으로 옮긴다 (여러 개를 한 번에도).
 * 편집 권한이 있는 캐릭터의 항목만 보인다.
 */
export function PatchReview() {
  const sb = supabaseBrowser();
  const { canEdit, dataVersion, bumpData } = useAdmin();
  const [latest, setLatest] = useState<Patch | null | undefined>(undefined);
  const [patchNames, setPatchNames] = useState<Map<number, string>>(new Map());
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [characterFilter, setCharacterFilter] = useState<number | "all">("all");
  const [kindFilter, setKindFilter] = useState<string | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: patches }, { data: chars }] = await Promise.all([
        sb.from("patches").select("*").order("released_on", { ascending: false }),
        sb.from("characters").select("id,slug,name,sort_order").order("sort_order"),
      ]);
      const newest = (patches ?? [])[0] as Patch | undefined;
      if (cancelled) return;
      setLatest(newest ?? null);
      setPatchNames(new Map((patches ?? []).map((p: Patch) => [p.id, formatPatchVersion(p.version)])));
      setCharacters((chars ?? []) as CharacterRow[]);
      if (!newest) return setItems([]);
      const results = await Promise.all(
        KINDS.map(async (kind) => {
          const { data } = await sb
            .from(kind.table)
            .select(kind.columns as string)
            .or(`patch_id.is.null,patch_id.neq.${newest.id}`)
            .order("character_id")
            .order("id");
          return ((data ?? []) as unknown as Row[]).map((row) => ({ ...row, kind, key: `${kind.table}:${row.id}` }));
        }),
      );
      if (!cancelled) setItems(results.flat());
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, dataVersion]);

  const charById = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const mine = useMemo(() => (items ?? []).filter((i) => canEdit(i.character_id)), [items, canEdit]);
  const visible = mine.filter(
    (i) => (characterFilter === "all" || i.character_id === characterFilter) && (kindFilter === "all" || i.kind.table === kindFilter),
  );
  const groups = characters
    .map((c) => ({ character: c, items: visible.filter((i) => i.character_id === c.id) }))
    .filter((g) => g.items.length > 0);
  const selectedVisible = visible.filter((i) => selected.has(i.key));

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** 기준 패치만 최신으로 (내용은 그대로) */
  async function markLatest(targets: Item[]) {
    if (!latest || targets.length === 0) return;
    if (targets.length > 1 && !confirm(`${targets.length}개 항목을 '변경 없음' 으로 표시하고 기준 패치를 ${formatPatchVersion(latest.version)} 로 바꿀까요?`))
      return;
    setBusy(true);
    setMessage(null);
    const byTable = new Map<string, number[]>();
    for (const t of targets) byTable.set(t.kind.table, [...(byTable.get(t.kind.table) ?? []), t.id]);
    const errors: string[] = [];
    let done = 0;
    for (const [table, ids] of byTable) {
      const { data, error } = await sb.from(table).update({ patch_id: latest.id }).in("id", ids).select("id");
      if (error) errors.push(describeError(error));
      done += data?.length ?? 0;
    }
    await revalidateSite(sb);
    setSelected(new Set());
    setBusy(false);
    setMessage(errors.length ? `일부 실패: ${errors.join(", ")}` : `${done}개 항목을 최신 패치로 표시했습니다.`);
    bumpData();
  }

  const title = (i: Item) => {
    if (i.kind.table === "character_overviews") return "캐릭터 개요";
    if (i.kind.table === "vs_guides") {
      const opp = i.opponent ? rosterBySlug(i.opponent)?.name.ko ?? i.opponent : "";
      return `VS ${opp}${i.title?.ko ? ` · ${i.title.ko}` : ""}`;
    }
    return i.title?.ko || `#${i.id}`;
  };

  return (
    <AdminSection title="패치 갱신" eyebrow="Patch review">
      {latest === undefined || items === null ? (
        <p className="text-muted">불러오는 중…</p>
      ) : !latest ? (
        <p className="text-sm text-muted">등록된 패치가 없습니다. 위의 &lsquo;패치&rsquo;에서 먼저 추가하세요.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            기준 패치가 최신(<b className="text-fg">{formatPatchVersion(latest.version)}</b>)이 아닌 항목입니다. 내용을 확인하고
            바뀐 게 없으면 <b className="text-fg">변경 없음</b>으로 기준 패치만 최신으로 옮기고, 바뀌었으면 수정하세요. 이
            표시는 &lsquo;최근 수정자&rsquo;를 바꾸지 않습니다.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="border border-border-strong bg-inset px-2.5 py-1.5 text-sm"
              aria-label="캐릭터"
            >
              <option value="all">모든 캐릭터 ({mine.length})</option>
              {characters
                .map((c) => ({ c, n: mine.filter((i) => i.character_id === c.id).length }))
                .filter(({ n }) => n > 0)
                .map(({ c, n }) => (
                  <option key={c.id} value={c.id}>
                    {c.name.ko} ({n})
                  </option>
                ))}
            </select>
            {[{ table: "all", label: "전체" }, ...KINDS].map((k) => (
              <button
                key={k.table}
                type="button"
                aria-pressed={kindFilter === k.table}
                onClick={() => setKindFilter(k.table)}
                className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
              >
                <span>{k.label}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="border border-dashed border-border py-8 text-center text-muted">
              확인할 항목이 없습니다. 모두 최신 패치 기준입니다.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 border border-border bg-surface-2 px-3 py-2 text-sm">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--accent)]"
                    checked={selectedVisible.length === visible.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(visible.map((i) => i.key)) : new Set())
                    }
                  />
                  보이는 항목 모두 선택 ({selectedVisible.length} / {visible.length})
                </label>
                <button
                  type="button"
                  disabled={busy || selectedVisible.length === 0}
                  onClick={() => markLatest(selectedVisible)}
                  className="skew ml-auto bg-accent px-4 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-40"
                >
                  <span>{busy ? "처리 중…" : `선택 ${selectedVisible.length}개 변경 없음 → 최신 패치로`}</span>
                </button>
              </div>
              {message && <p className="text-sm text-highlight-text">{message}</p>}

              <div className="flex flex-col gap-4">
                {groups.map(({ character, items: list }) => (
                  <section key={character.id} className="border border-border bg-surface">
                    <h3 className="flex items-center gap-2 border-b border-border px-4 py-2 font-bold">
                      {character.name.ko}
                      <span className="text-xs font-semibold text-muted">{list.length}개</span>
                    </h3>
                    <ul className="divide-y divide-border">
                      {list.map((item) => (
                        <li key={item.key} className="flex flex-wrap items-center gap-3 px-4 py-2">
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--accent)]"
                            checked={selected.has(item.key)}
                            onChange={() => toggle(item.key)}
                            aria-label={`${title(item)} 선택`}
                          />
                          <span className="border border-border-strong px-1.5 py-0.5 text-xs text-muted">{item.kind.label}</span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-semibold">{title(item)}</span>
                            {item.notation_classic && (
                              <span className="truncate text-xs text-muted">
                                <NotationText notation={item.notation_classic} />
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-warn">
                            {item.patch_id ? (patchNames.get(item.patch_id) ?? `#${item.patch_id}`) : "패치 지정 안 함"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Link
                              href={hrefFor(item, charById.get(item.character_id)?.slug ?? "")}
                              className="border border-border-strong px-2 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-accent"
                            >
                              보기
                            </Link>
                            <EditButton entity={item.kind.entity as EntityType} id={item.id} scope={item.character_id} />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => markLatest([item])}
                              className="border border-highlight/60 px-2 py-1 text-xs font-bold text-highlight-text hover:bg-highlight hover:text-highlight-fg disabled:opacity-40"
                            >
                              변경 없음
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AdminSection>
  );
}
