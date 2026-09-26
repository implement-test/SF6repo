"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { describeError, revalidateSite, supabaseBrowser } from "@/lib/supabase/browser";
import type { EntityType } from "@/lib/admin/entities";
import type { Localized, Patch } from "@/lib/types";
import { formatPatchVersion } from "@/lib/patch";
import { rosterBySlug } from "@/lib/roster";
import { countMissingTranslations as countMissing } from "@/lib/translation";
import { EditButton, useAdmin } from "./admin-context";
import { AdminSection } from "./admin-section";
import { NotationText } from "../notation";

/** 확인 대상 콘텐츠 표 */
const KINDS = [
  { table: "combos", entity: "combo", label: "콤보" },
  { table: "setups", entity: "setup", label: "셋업" },
  { table: "moves", entity: "move", label: "커맨드" },
  { table: "vs_guides", entity: "vs", label: "Vs 가이드" },
  { table: "character_overviews", entity: "overview", label: "개요" },
] as const;

type Kind = (typeof KINDS)[number];
type Row = Record<string, unknown> & { id: number; character_id: number; patch_id: number | null; is_published: boolean };
type Item = { row: Row; kind: Kind; key: string; missing: { en: number; ja: number } };
type CharacterRow = { id: number; slug: string; name: Localized };
type Tab = "patch" | "translation" | "unpublished";

const TABS: { id: Tab; label: string }[] = [
  { id: "patch", label: "이전 패치" },
  { id: "translation", label: "번역 누락" },
  { id: "unpublished", label: "비공개" },
];

/** 이 항목이 보이는 페이지 (바로가기) */
function hrefFor(item: Item, slug: string): string {
  const { id, opponent } = item.row as Row & { opponent?: string };
  switch (item.kind.table) {
    case "combos":
      return `/${slug}/combos#combo-${id}`;
    case "setups":
      return `/${slug}/setups#setup-${id}`;
    case "moves":
      return `/${slug}/moves#move-${id}`;
    case "vs_guides":
      return `/${slug}/vs?vs=${opponent}#vs-${id}`;
    default:
      return `/${slug}`;
  }
}

function titleOf(item: Item): string {
  const r = item.row as Row & { title?: Localized | null; name?: Localized; opponent?: string };
  if (item.kind.table === "character_overviews") return "캐릭터 개요";
  if (item.kind.table === "moves") return r.name?.ko || `#${r.id}`;
  if (item.kind.table === "vs_guides") {
    const opp = r.opponent ? (rosterBySlug(r.opponent)?.name.ko ?? r.opponent) : "";
    return `VS ${opp}${r.title?.ko ? ` · ${r.title.ko}` : ""}`;
  }
  return r.title?.ko || `#${r.id}`;
}

function notationOf(item: Item): string | null {
  const r = item.row as Row & { notation_classic?: string | null; input_classic?: string };
  return (item.kind.table === "moves" ? r.input_classic : r.notation_classic) || null;
}

/**
 * 확인 필요: 이전 패치 기준 / 번역 누락 / 비공개 항목을 모아 보여 주고 바로 처리한다.
 * 편집 권한이 있는 캐릭터의 항목만 보인다.
 */
export function ReviewCenter() {
  const sb = supabaseBrowser();
  const { canEdit, dataVersion, bumpData } = useAdmin();
  const [tab, setTab] = useState<Tab>("patch");
  const [latest, setLatest] = useState<Patch | null | undefined>(undefined);
  const [patchNames, setPatchNames] = useState<Map<number, string>>(new Map());
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [characterFilter, setCharacterFilter] = useState<number | "all">("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: patches }, { data: chars }, ...tables] = await Promise.all([
        sb.from("patches").select("*").order("released_on", { ascending: false }),
        sb.from("characters").select("id,slug,name").order("sort_order"),
        ...KINDS.map((kind) => sb.from(kind.table).select("*").order("character_id").order("id")),
      ]);
      if (cancelled) return;
      setLatest(((patches ?? [])[0] as Patch | undefined) ?? null);
      setPatchNames(new Map((patches ?? []).map((p: Patch) => [p.id, formatPatchVersion(p.version)])));
      setCharacters((chars ?? []) as CharacterRow[]);
      setItems(
        KINDS.flatMap((kind, k) =>
          ((tables[k].data ?? []) as Row[]).map((row) => ({
            row,
            kind,
            key: `${kind.table}:${row.id}`,
            missing: countMissing(row),
          })),
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, dataVersion]);

  const charById = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const mine = useMemo(() => (items ?? []).filter((i) => canEdit(i.row.character_id)), [items, canEdit]);
  const inTab = useMemo(() => {
    const byTab: Record<Tab, Item[]> = {
      patch: latest ? mine.filter((i) => i.row.patch_id !== latest.id) : [],
      translation: mine.filter((i) => i.missing.en > 0 || i.missing.ja > 0),
      unpublished: mine.filter((i) => !i.row.is_published),
    };
    return byTab;
  }, [mine, latest]);
  const current = inTab[tab];
  const visible = current.filter(
    (i) =>
      (characterFilter === "all" || i.row.character_id === characterFilter) &&
      (kindFilter === "all" || i.kind.table === kindFilter),
  );
  const groups = characters
    .map((c) => ({ character: c, items: visible.filter((i) => i.row.character_id === c.id) }))
    .filter((g) => g.items.length > 0);
  const selectedVisible = visible.filter((i) => selected.has(i.key));
  const bulk = tab === "patch" || tab === "unpublished";

  function switchTab(next: Tab) {
    setTab(next);
    setSelected(new Set());
    setMessage(null);
  }

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** 여러 표에 같은 값을 한 번에 적용 (패치: 기준 패치만 최신으로 / 비공개: 공개로) */
  async function apply(targets: Item[]) {
    if (targets.length === 0) return;
    const patch = tab === "patch" ? latest : null;
    if (tab === "patch" && !patch) return;
    const what =
      tab === "patch" ? `'변경 없음' 으로 표시하고 기준 패치를 ${formatPatchVersion(patch!.version)} 로` : "공개로";
    if (targets.length > 1 && !confirm(`${targets.length}개 항목을 ${what} 바꿀까요?`)) return;
    setBusy(true);
    setMessage(null);
    const values = tab === "patch" ? { patch_id: patch!.id } : { is_published: true };
    const byTable = new Map<string, number[]>();
    for (const t of targets) byTable.set(t.kind.table, [...(byTable.get(t.kind.table) ?? []), t.row.id]);
    const errors: string[] = [];
    let done = 0;
    for (const [table, ids] of byTable) {
      const { data, error } = await sb.from(table).update(values).in("id", ids).select("id");
      if (error) errors.push(describeError(error));
      done += data?.length ?? 0;
    }
    await revalidateSite(sb);
    setSelected(new Set());
    setBusy(false);
    setMessage(errors.length ? `일부 실패: ${errors.join(", ")}` : `${done}개 항목을 처리했습니다.`);
    bumpData();
  }

  const actionLabel = tab === "patch" ? "변경 없음" : "공개하기";

  return (
    <AdminSection title="확인 필요" eyebrow="Review">
      {latest === undefined || items === null ? (
        <p className="text-muted">불러오는 중…</p>
      ) : (
        <>
          {/* 탭: 개수와 함께 */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={tab === t.id}
                onClick={() => switchTab(t.id)}
                className="skew border border-border-strong px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
              >
                <span>
                  {t.label} <span className="tabular-nums opacity-80">({inTab[t.id].length})</span>
                </span>
              </button>
            ))}
          </div>

          <p className="text-sm text-muted">
            {tab === "patch" &&
              (latest ? (
                <>
                  기준 패치가 최신(<b className="text-fg">{formatPatchVersion(latest.version)}</b>)이 아닌 항목입니다. 바뀐 게
                  없으면 <b className="text-fg">변경 없음</b>으로 기준 패치만 최신으로 옮기고, 바뀌었으면 수정하세요. 이 표시는
                  &lsquo;최근 수정자&rsquo;를 바꾸지 않습니다.
                </>
              ) : (
                <>등록된 패치가 없습니다. 위의 &lsquo;패치&rsquo;에서 먼저 추가하세요.</>
              ))}
            {tab === "translation" &&
              "영어(EN)·일본어(JA)가 빠진 글이 있는 항목입니다. 숫자는 빠진 글의 수 (제목·내용·메모·선택지 설명 등 전부 포함)."}
            {tab === "unpublished" && "공개가 꺼져 있어 방문자에게 보이지 않는 항목입니다."}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="border border-border-strong bg-inset px-2.5 py-1.5 text-sm"
              aria-label="캐릭터"
            >
              <option value="all">모든 캐릭터 ({current.length})</option>
              {characters
                .map((c) => ({ c, n: current.filter((i) => i.row.character_id === c.id).length }))
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
                className="border border-border-strong px-2.5 py-1 text-xs font-bold text-muted aria-pressed:border-accent aria-pressed:text-accent"
              >
                {k.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="border border-dashed border-border py-8 text-center text-muted">확인할 항목이 없습니다.</p>
          ) : (
            <>
              {bulk && (
                <div className="flex flex-wrap items-center gap-3 border border-border bg-surface-2 px-3 py-2 text-sm">
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--accent)]"
                      checked={selectedVisible.length === visible.length}
                      onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((i) => i.key)) : new Set())}
                    />
                    보이는 항목 모두 선택 ({selectedVisible.length} / {visible.length})
                  </label>
                  <button
                    type="button"
                    disabled={busy || selectedVisible.length === 0}
                    onClick={() => apply(selectedVisible)}
                    className="skew ml-auto bg-accent px-4 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-40"
                  >
                    <span>
                      {busy
                        ? "처리 중…"
                        : tab === "patch"
                          ? `선택 ${selectedVisible.length}개 변경 없음 → 최신 패치로`
                          : `선택 ${selectedVisible.length}개 공개하기`}
                    </span>
                  </button>
                </div>
              )}
              {message && <p className="text-sm text-highlight-text">{message}</p>}

              <div className="flex flex-col gap-4">
                {groups.map(({ character, items: list }) => (
                  <section key={character.id} className="border border-border bg-surface">
                    <h3 className="flex items-center gap-2 border-b border-border px-4 py-2 font-bold">
                      {character.name.ko}
                      <span className="text-xs font-semibold text-muted">{list.length}개</span>
                    </h3>
                    <ul className="divide-y divide-border">
                      {list.map((item) => {
                        const notation = notationOf(item);
                        return (
                          <li key={item.key} className="flex flex-wrap items-center gap-3 px-4 py-2">
                            {bulk && (
                              <input
                                type="checkbox"
                                className="size-4 accent-[var(--accent)]"
                                checked={selected.has(item.key)}
                                onChange={() => toggle(item.key)}
                                aria-label={`${titleOf(item)} 선택`}
                              />
                            )}
                            <span className="border border-border-strong px-1.5 py-0.5 text-xs text-muted">{item.kind.label}</span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-sm font-semibold">{titleOf(item)}</span>
                              {notation && (
                                <span className="truncate text-xs text-muted">
                                  <NotationText notation={notation} />
                                </span>
                              )}
                            </span>
                            {tab === "patch" && (
                              <span className="text-xs text-warn">
                                {item.row.patch_id ? (patchNames.get(item.row.patch_id) ?? `#${item.row.patch_id}`) : "패치 지정 안 함"}
                              </span>
                            )}
                            {tab === "translation" && (
                              <span className="flex gap-1 text-xs font-bold">
                                {item.missing.en > 0 && (
                                  <span className="border border-warn/50 px-1.5 py-0.5 text-warn">EN {item.missing.en}</span>
                                )}
                                {item.missing.ja > 0 && (
                                  <span className="border border-warn/50 px-1.5 py-0.5 text-warn">JA {item.missing.ja}</span>
                                )}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Link
                                href={hrefFor(item, charById.get(item.row.character_id)?.slug ?? "")}
                                className="border border-border-strong px-2 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-accent"
                              >
                                보기
                              </Link>
                              <EditButton entity={item.kind.entity as EntityType} id={item.row.id} scope={item.row.character_id} />
                              {bulk && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => apply([item])}
                                  className="border border-highlight/60 px-2 py-1 text-xs font-bold text-highlight-text hover:bg-highlight hover:text-highlight-fg disabled:opacity-40"
                                >
                                  {actionLabel}
                                </button>
                              )}
                            </span>
                          </li>
                        );
                      })}
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
