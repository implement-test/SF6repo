"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Character, Combo, Localized, Practice, Setup, VsGuide } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { FAVORITE_KINDS, useAllFavorites, type FavoriteKind } from "@/lib/favorites";
import { normalizeOptions, normalizePractice } from "@/lib/setup";
import { normalizeStarterGroups } from "@/lib/starters";
import { normalizeVsActions } from "@/lib/vs-actions";
import { ComboCard } from "./combo-card";
import { SetupCard } from "./setup-card";
import { VsGuideCard } from "./vs-guide-card";
import { ExpandAllButton } from "./card-controls";

type Loaded = {
  characters: Map<number, Character>;
  latestPatchId: number | null;
  authors: Record<string, string>;
  situationNames: Record<string, string>;
  combos: Combo[];
  setups: Setup[];
  setupCombos: Map<number, Combo[]>;
  practices: Practice[];
  vs: VsGuide[];
};

/** 탭(페이지) 이름: 카드가 원래 있는 곳 */
const PAGE: Record<FavoriteKind, string> = { combo: "combos", setup: "setups", practice: "practice", vs: "vs" };

/**
 * 개인 홈: 이 브라우저에 저장된 즐겨찾기(콤보 · 셋업 · 추천 연습 · Vs 가이드)를 모아 보여 준다.
 * 페이지는 정적이고, 즐겨찾기 id 로 공개 항목만 브라우저에서 직접 불러온다 (anon 키, 로그인 없음).
 */
export function FavoritesHome({ locale, dict }: { locale: Locale; dict: Dictionary }) {
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

  // 즐겨찾기에 담은 순서대로. 지워졌거나 비공개가 된 항목은 빠진다
  const ordered = <T extends { id: number }>(kind: FavoriteKind, rows: T[]) => {
    const byId = new Map(rows.map((r) => [r.id, r]));
    return favorites[kind].map((id) => byId.get(id)).filter((r) => r !== undefined);
  };
  const sections = {
    combo: ordered("combo", data.combos),
    setup: ordered("setup", data.setups),
    practice: ordered("practice", data.practices),
    vs: ordered("vs", data.vs),
  };
  const total = FAVORITE_KINDS.reduce((sum, k) => sum + sections[k].length, 0);
  if (total === 0) return <p className="border border-dashed border-border py-12 text-center text-muted">{t.empty}</p>;

  const origin = (kind: FavoriteKind, item: { id: number; character_id: number; opponent?: string }) => {
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
      <div className="flex justify-end">
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
                  {origin(kind, item as { id: number; character_id: number; opponent?: string })}
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
  const slugOf = (characterId: number) => data.characters.get(characterId)?.slug ?? "";
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
          linkedCombos={kind === "setup" ? (data.setupCombos.get(setup.id) ?? []) : []}
          latestPatchId={data.latestPatchId}
          authors={data.authors}
          characterSlug={slugOf(setup.character_id)}
        />
      );
    }
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

  const [characters, patches, authors, situations, combos, setups, practices, vs] = await Promise.all([
    sb.from("characters").select("*"),
    sb.from("patches").select("id").order("released_on", { ascending: false }).limit(1),
    sb.from("author_names").select("*"),
    sb.from("setup_situations").select("slug,name"),
    pick<Combo>("combos", favorites.combo),
    pick<Setup>("setups", favorites.setup),
    pick<Practice>("practices", favorites.practice),
    pick<VsGuide>("vs_guides", favorites.vs),
  ]);

  // 셋업으로 이어지는 콤보
  const setupCombos = new Map<number, Combo[]>();
  if (setups.length > 0) {
    const { data: links } = await sb
      .from("setup_combos")
      .select("setup_id,combo_id")
      .in(
        "setup_id",
        setups.map((s) => s.id),
      )
      .order("sort_order");
    const linked = await pick<Combo>("combos", [...new Set((links ?? []).map((l) => l.combo_id as number))]);
    const byId = new Map(linked.map((c) => [c.id, c]));
    for (const l of links ?? []) {
      const combo = byId.get(l.combo_id);
      if (combo) setupCombos.set(l.setup_id, [...(setupCombos.get(l.setup_id) ?? []), combo]);
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
    setupCombos,
    practices: practices.map((p) => ({ ...p, options: normalizeOptions(p.options), practice: normalizePractice(p.practice) })),
    vs: vs.map((g) => ({ ...g, actions: normalizeVsActions(g.actions) })),
  };
}
