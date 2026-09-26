"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser, describeError } from "@/lib/supabase/browser";
import { copyValues } from "@/lib/admin/copy";
import { ROSTER, rosterBySlug } from "@/lib/roster";
import { normalizeVsActions } from "@/lib/vs-actions";
import type { Localized, VsAction } from "@/lib/types";
import { useAdmin } from "./admin-context";
import { inputClass } from "./starters-input";
import { NotationText } from "../notation";

type GuideRow = Record<string, unknown> & {
  id: number;
  character_id: number;
  opponent: string;
  topic: string;
  title: Localized | null;
  body: Localized | null;
  actions: VsAction[];
  is_published: boolean;
};
type CharacterRow = { id: number; name: Localized };

const TOPIC_LABELS: Record<string, string> = {
  whiff_punish: "윕퍼 노릴 동작",
  block_punish: "가드 후 딜캐",
  pressure_gap: "압박 사이 끼어들기",
  cheese: "날먹/무뇌패턴 파해",
  setup: "주요 셋업",
};

const text = (l: Localized | null | undefined) => [l?.ko, l?.en, l?.ja].filter(Boolean).join(" ");

/**
 * Vs 가이드 검색해서 가져오기: 다른 캐릭터의 Vs 가이드를 찾아, 지금 캐릭터의 새 항목으로 복사한 창을 연다.
 * 예: 고우키 페이지에서 '류 vs 테리' 의 내용을 찾아 '고우키 vs 테리' 로.
 */
export default function VsImportPanel({
  characterId,
  characterName,
  opponent,
  onClose,
}: {
  characterId: number;
  characterName: string;
  /** 지금 고른 상대 (기본 거르기) */
  opponent: string | null;
  onClose: () => void;
}) {
  const sb = supabaseBrowser();
  const { openEditor } = useAdmin();
  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [characters, setCharacters] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [opponentFilter, setOpponentFilter] = useState<string>(opponent ?? "all");
  const [characterFilter, setCharacterFilter] = useState<number | "all">("all");

  useEffect(() => {
    Promise.all([
      sb.from("vs_guides").select("*").neq("character_id", characterId).order("character_id").order("sort_order"),
      sb.from("characters").select("id,name").order("sort_order"),
    ]).then(([g, c]) => {
      if (g.error) setError(describeError(g.error));
      setGuides(((g.data ?? []) as GuideRow[]).map((r) => ({ ...r, actions: normalizeVsActions(r.actions) })));
      setCharacters(new Map(((c.data ?? []) as CharacterRow[]).map((r) => [r.id, r.name.ko])));
    });
  }, [sb, characterId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return (guides ?? []).filter((g) => {
      if (opponentFilter !== "all" && g.opponent !== opponentFilter) return false;
      if (characterFilter !== "all" && g.character_id !== characterFilter) return false;
      if (words.length === 0) return true;
      const hay = [
        text(g.title),
        text(g.body),
        ...g.actions.flatMap((a) => [a.classic, a.modern ?? "", text(a.note)]),
        TOPIC_LABELS[g.topic] ?? "",
        characters.get(g.character_id) ?? "",
        rosterBySlug(g.opponent)?.name.ko ?? g.opponent,
      ]
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [guides, query, opponentFilter, characterFilter, characters]);

  function importGuide(g: GuideRow) {
    openEditor({ entity: "vs", defaults: { character_id: characterId }, initial: copyValues("vs", g) });
    onClose();
  }

  const selectClass = "border border-border-strong bg-inset px-2 py-1.5 text-sm";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Vs 가이드 가져오기"
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col border border-accent bg-surface shadow-2xl"
      >
        <div className="brand-bar h-[3px]" />
        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
          <span className="eyebrow text-accent!">Import</span>
          <h2 className="display text-2xl">다른 가이드에서 가져오기</h2>
          <button type="button" onClick={onClose} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="닫기">
            ×
          </button>
        </header>

        <div className="flex flex-col gap-2 border-b border-border px-5 py-3">
          <p className="text-xs text-muted">
            다른 캐릭터의 Vs 가이드를 찾아 <b className="text-fg">{characterName}</b>의 새 항목으로 복사합니다. 고르면 편집 창이
            열리고, 저장해야 만들어집니다.
          </p>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색: 제목, 내용, 선택지 설명, 표기(2HK, 236HP …), 캐릭터 이름"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <select value={opponentFilter} onChange={(e) => setOpponentFilter(e.target.value)} className={selectClass} aria-label="상대">
              <option value="all">모든 상대</option>
              {ROSTER.map((c) => (
                <option key={c.slug} value={c.slug}>
                  vs {c.name.ko}
                </option>
              ))}
            </select>
            <select
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className={selectClass}
              aria-label="원본 캐릭터"
            >
              <option value="all">모든 캐릭터</option>
              {[...characters]
                .filter(([id]) => id !== characterId && (guides ?? []).some((g) => g.character_id === id))
                .map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {error && <p className="px-2 py-2 text-sm text-warn">{error}</p>}
          {guides === null ? (
            <p className="px-2 py-2 text-sm text-muted">불러오는 중…</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">찾는 가이드가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {results.map((g) => (
                <li key={g.id} className="flex items-start gap-3 border border-border bg-surface-2 px-3 py-2.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold">
                        {characters.get(g.character_id) ?? `#${g.character_id}`} vs {rosterBySlug(g.opponent)?.name.ko ?? g.opponent}
                      </span>
                      <span className="border border-accent/50 px-1.5 text-accent">{TOPIC_LABELS[g.topic] ?? g.topic}</span>
                      {!g.is_published && <span className="border border-border-strong px-1.5 text-muted">비공개</span>}
                    </p>
                    {g.title?.ko && <p className="truncate text-sm font-semibold">{g.title.ko}</p>}
                    {g.body?.ko && <p className="line-clamp-2 text-xs whitespace-pre-line text-muted">{g.body.ko}</p>}
                    {g.actions.length > 0 && (
                      <p className="truncate text-xs text-muted">
                        {g.actions.map((a, i) => (
                          <span key={i} className="mr-3">
                            {i + 1}. <NotationText notation={a.classic || "—"} />
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => importGuide(g)}
                    className="skew shrink-0 bg-accent px-3 py-1 text-xs font-bold text-accent-fg"
                  >
                    <span>가져오기</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
