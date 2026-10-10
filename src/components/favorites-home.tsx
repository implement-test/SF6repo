"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Character, Combo, CommonGuide, ComboEnder, Localized, Practice, Setup, SetupEnderLink, VsGuide } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { FAVORITE_KINDS, useAllFavorites, type FavoriteKind } from "@/lib/favorites";
import { normalizeOptions, normalizePractice } from "@/lib/setup";
import { normalizeStarterGroups } from "@/lib/starters";
import { normalizeVsPatterns } from "@/lib/vs-patterns";
import { linkedEndersFor, type LinkedEnder } from "@/lib/setup-links";
import { ComboCard } from "./combo-card";
import { SetupCard } from "./setup-card";
import { VsGuideCard } from "./vs-guide-card";
import { CommonGuideCard } from "./common-guide-card";
import { ExpandAllButton } from "./card-controls";

type Loaded = {
  characters: Map<number, Character>;
  latestPatchId: number | null;
  authors: Record<string, string>;
  situationNames: Record<string, string>;
  combos: Combo[];
  setups: Setup[];
  setupEnders: Map<number, LinkedEnder[]>;
  enders: ComboEnder[];
  practices: Practice[];
  vs: VsGuide[];
  guides: CommonGuide[];
};

/** 탭(페이지) 이름: 카드가 원래 있는 곳 */
const PAGE: Record<FavoriteKind, string> = { combo: "combos", setup: "setups", practice: "practice", vs: "vs", guide: "" };
/** 공통 공략의 항목이 있는 곳 (character_id 가 없는 항목) */
const COMMON_PAGE: Partial<Record<FavoriteKind, string>> = { practice: "/guide/practice", guide: "/guide" };

/**
 * 개인 홈: 이 브라우저에 저장된 즐겨찾기(콤보 · 셋업 · 추천 연습 · Vs 가이드 · 공통 공략의 시스템 글)를 모아 보여 준다.
 * 공통 공략의 항목(시스템 글, 공통 추천 연습)은 모아 보기(/favorites)에만 나오고 캐릭터의 즐겨찾기 탭에는 나오지 않는다.
 * 페이지는 정적이고, 즐겨찾기 id 로 공개 항목만 브라우저에서 직접 불러온다 (anon 키, 로그인 없음).
 */
export function FavoritesHome({
  locale,
  dict,
  characterSlug,
}: {
  locale: Locale;
  dict: Dictionary;
  /** 캐릭터 페이지의 즐겨찾기 탭: 이 캐릭터의 항목만 */
  characterSlug?: string;
}) {
  const favorites = useAllFavorites();
  const [data, setData] = useState<Loaded | null>(null);
  const key = favorites ? JSON.stringify(favorites) : "";

  useEffect(() => {
    if (!favorites) return;
    let cancelled = false;
    (async () => {
      const loaded = await load(favorites);
      if (!cancelled) setData(loaded);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 즐겨찾기 목록(key)이 바뀔 때만 다시 불러온다
  }, [key]);

  const t = dict.favoritesPage;
  if (!favorites || !data) return <p className="text-muted">{t.loading}</p>;

  // 즐겨찾기에 담은 순서대로. 지워졌거나 비공개가 된 항목, 비공개 캐릭터의 항목은 빠진다
  const ordered = <T extends { id: number; character_id?: number | null }>(kind: FavoriteKind, rows: T[]) => {
    const byId = new Map(
      rows
        .filter((r) =>
          r.character_id == null
            ? !characterSlug
            : data.characters.has(r.character_id) &&
              (!characterSlug || data.characters.get(r.character_id)?.slug === characterSlug),
        )
        .map((r) => [r.id, r]),
    );
    return favorites[kind].map((id) => byId.get(id)).filter((r) => r !== undefined);
  };
  const sections = {
    combo: ordered("combo", data.combos),
    setup: ordered("setup", data.setups),
    practice: ordered("practice", data.practices),
    vs: ordered("vs", data.vs),
    guide: ordered("guide", data.guides),
  };
  const total = FAVORITE_KINDS.reduce((sum, k) => sum + sections[k].length, 0);
  // 캐릭터 탭에서는 모든 캐릭터 모아보기로 가는 링크
  const allLink = characterSlug ? (
    <Link href="/favorites" className="text-sm font-semibold text-muted hover:text-accent">
      {t.all} →
    </Link>
  ) : null;
  if (total === 0)
    return (
      <div className="flex flex-col gap-3">
        {allLink && <div className="flex justify-end">{allLink}</div>}
        <p className="border border-dashed border-border py-12 text-center text-muted">{t.empty}</p>
      </div>
    );

  const origin = (kind: FavoriteKind, item: { id: number; character_id?: number | null; opponent?: string }) => {
    if (item.character_id == null) {
      return (
        <Link
          href={`${COMMON_PAGE[kind] ?? "/guide"}#${kind}-${item.id}`}
          className="flex items-center gap-1.5 self-start text-xs font-semibold text-muted hover:text-accent"
        >
          <span className="text-fg">{dict.guide.title}</span>
          <span>· {t.kinds[kind]}</span>
          <span aria-hidden>→</span>
        </Link>
      );
    }
    const character = data.characters.get(item.character_id);
    if (!character) return null;
    const query = kind === "vs" && item.opponent ? `?vs=${item.opponent}` : "";
    return (
      <Link
        href={`/${character.slug}/${PAGE[kind]}${query}#${kind}-${item.id}`}
        className="flex items-center gap-1.5 self-start text-xs font-semibold text-muted hover:text-accent"
      >
        <span className="text-fg">{pickLocalized(character.name, locale).text}</span>
        <span>· {t.kinds[kind]}</span>
        <span aria-hidden>→</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-10" data-card-list="">
      <div className="flex items-center justify-end gap-4">
        {allLink}
        <ExpandAllButton labels={dict.list} />
      </div>
      {FAVORITE_KINDS.map((kind) => {
        const items = sections[kind];
        if (items.length === 0) return null;
        return (
          <section key={kind} className="flex flex-col gap-3">
            <h2 className="flex items-baseline gap-2 border-b-2 border-accent pb-1.5">
              <span className="display text-2xl">{t.kinds[kind]}</span>
              <span className="text-sm text-muted tabular-nums">{items.length}</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-1">
                  {origin(kind, item as { id: number; character_id?: number | null; opponent?: string })}
                  {renderCard(kind, item, data, locale, dict)}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function renderCard(kind: FavoriteKind, item: unknown, data: Loaded, locale: Locale, dict: Dictionary) {
  const slugOf = (characterId: number | null) => (characterId === null ? "" : (data.characters.get(characterId)?.slug ?? ""));
  switch (kind) {
    case "combo": {
      const combo = item as Combo;
      return (
        <ComboCard
          combo={combo}
          locale={locale}
          dict={dict}
          latestPatchId={data.latestPatchId}
          authors={data.authors}
          characterSlug={slugOf(combo.character_id)}
          enders={data.enders.filter((e) => e.character_id === combo.character_id)}
        />
      );
    }
    case "setup":
    case "practice": {
      const setup = item as Setup | Practice;
      return (
        <SetupCard
          kind={kind}
          setup={setup}
          locale={locale}
          dict={dict}
          situationNames={data.situationNames}
          linkedEnders={kind === "setup" ? (data.setupEnders.get(setup.id) ?? []) : []}
          latestPatchId={data.latestPatchId}
          authors={data.authors}
          characterSlug={slugOf(setup.character_id)}
        />
      );
    }
    case "guide":
      return (
        <CommonGuideCard
          guide={item as CommonGuide}
          locale={locale}
          dict={dict}
          latestPatchId={data.latestPatchId}
          authors={data.authors}
        />
      );
    case "vs":
      return (
        <VsGuideCard
          guide={item as VsGuide}
          locale={locale}
          dict={dict}
          latestPatchId={data.latestPatchId}
          authors={data.authors}
        />
      );
  }
}

async function load(favorites: Record<FavoriteKind, number[]>): Promise<Loaded> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // 빈 목록이면 부르지 않는다. 표가 아직 없으면(마이그레이션 전) 빈 목록
  const pick = async <T,>(table: string, ids: number[]): Promise<T[]> => {
    if (ids.length === 0) return [];
    const { data } = await sb.from(table).select("*").in("id", ids).eq("is_published", true);
    return (data ?? []) as T[];
  };

  const [characters, patches, authors, situations, combos, setups, practices, vs, guides] = await Promise.all([
    sb.from("characters").select("*"),
    sb.from("patches").select("id").order("released_on", { ascending: false }).limit(1),
    sb.from("author_names").select("*"),
    sb.from("setup_situations").select("slug,name"),
    pick<Combo>("combos", favorites.combo),
    pick<Setup>("setups", favorites.setup),
    pick<Practice>("practices", favorites.practice),
    pick<VsGuide>("vs_guides", favorites.vs),
    pick<CommonGuide>("common_guides", favorites.guide),
  ]);

  // 엔더(콤보 카드의 후상황 기본값, 셋업 카드의 이어지는 엔더): 즐겨찾기한 콤보 · 셋업의 캐릭터만
  const characterIds = [...new Set([...combos, ...setups].map((x) => x.character_id))];
  const enders =
    characterIds.length === 0
      ? []
      : (((await sb.from("combo_enders").select("*").in("character_id", characterIds).order("sort_order").order("id"))
          .data ?? []) as ComboEnder[]);

  // 셋업으로 이어지는 엔더와 그 엔더로 끝나는 콤보 수
  const setupEnders = new Map<number, LinkedEnder[]>();
  if (setups.length > 0) {
    const setupCharacters = [...new Set(setups.map((s) => s.character_id))];
    const [{ data: links }, { data: characterCombos }] = await Promise.all([
      sb
        .from("setup_enders")
        .select("*")
        .in(
          "setup_id",
          setups.map((s) => s.id),
        )
        .order("sort_order"),
      sb.from("combos").select("*").in("character_id", setupCharacters).eq("is_published", true),
    ]);
    for (const s of setups) {
      setupEnders.set(
        s.id,
        linkedEndersFor(
          s.id,
          (links ?? []) as SetupEnderLink[],
          enders.filter((e) => e.character_id === s.character_id),
          ((characterCombos ?? []) as Combo[]).filter((c) => c.character_id === s.character_id),
        ),
      );
    }
  }

  const authorRows = (authors.data ?? []) as { user_id: string; display_name: string }[];
  return {
    characters: new Map(((characters.data ?? []) as Character[]).map((c) => [c.id, c])),
    latestPatchId: (patches.data?.[0]?.id as number | undefined) ?? null,
    authors: Object.fromEntries(authorRows.map((a) => [a.user_id, a.display_name])),
    situationNames: Object.fromEntries(
      ((situations.data ?? []) as { slug: string; name: Localized }[]).map((s) => [s.slug, s.name.ko]),
    ),
    combos: combos.map((c) => ({ ...c, starters: normalizeStarterGroups(c.starters) })),
    setups: setups.map((s) => ({ ...s, options: normalizeOptions(s.options), practice: normalizePractice(s.practice) })),
    setupEnders,
    enders,
    practices: practices.map((p) => ({ ...p, options: normalizeOptions(p.options), practice: normalizePractice(p.practice) })),
    vs: vs.map((g) => ({ ...g, patterns: normalizeVsPatterns(g.patterns) })),
    guides,
  };
}
