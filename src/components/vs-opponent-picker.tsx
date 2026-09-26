"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";
import { ROSTER, ROSTER_GROUPS, rosterBySlug, rosterImage } from "@/lib/roster";
import { setVsOpponent, useVsCounts, useVsOpponent } from "@/lib/vs-store";

/**
 * Vs 가이드의 상대 캐릭터 선택. 캐릭터 레이아웃의 필터 바 위에 두고, Vs 탭에서만 보인다.
 * 기본은 접힘. 펼치면 분류(초기 로스터 / 시즌 1~4)마다 테두리로 묶어 32명을 보여 준다.
 */
export function VsOpponentPicker({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const pathname = usePathname();
  const opponent = useVsOpponent();
  const counts = useVsCounts();
  const [open, setOpen] = useState(false);
  if (!pathname.endsWith("/vs")) return null;

  const selected = opponent ? rosterBySlug(opponent) : undefined;
  const name = (slug: string) => {
    const c = rosterBySlug(slug);
    return c ? pickLocalized(c.name, locale).text : slug;
  };
  const pick = (slug: string | null) => {
    setVsOpponent(slug);
    setOpen(false);
  };

  return (
    <section className="border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2"
      >
        <span className="eyebrow">{dict.vs.opponent}</span>
        {selected ? (
          <span className="flex items-center gap-2">
            <Portrait slug={selected.slug} label={name(selected.slug)} className="h-9 w-8" />
            <span className="display text-lg">{name(selected.slug)}</span>
          </span>
        ) : (
          <span className="display text-lg text-muted">{dict.vs.all}</span>
        )}
        <span className="ml-auto text-xs font-bold text-muted">
          {open ? `${dict.vs.collapse} ▲` : `${dict.vs.expand} ▼`}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border p-3">
          <button
            type="button"
            aria-pressed={!opponent}
            onClick={() => pick(null)}
            className="skew self-start border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg"
          >
            <span>
              {dict.vs.all}
              {counts && ` (${Object.values(counts).reduce((a, b) => a + b, 0)})`}
            </span>
          </button>
          {/* 초기 로스터는 전체 폭에 한 줄 6명, 시즌 1~4 는 그 아래 2×2 로 각각 한 줄 4명 */}
          <div className="grid gap-3 md:grid-cols-2">
            {ROSTER_GROUPS.map((group) => (
              <fieldset
                key={group.id}
                className={`min-w-0 border border-border-strong px-3 pt-1 pb-3 ${group.id === "base" ? "md:col-span-2" : ""}`}
              >
                <legend className="px-1.5 text-sm font-bold text-muted">{pickLocalized(group.name, locale).text}</legend>
                <div className={`grid gap-2 ${group.id === "base" ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-4"}`}>
                  {ROSTER.filter((c) => c.group === group.id).map((c) => {
                    const on = opponent === c.slug;
                    const count = counts[c.slug] ?? 0;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        aria-pressed={on}
                        title={name(c.slug)}
                        onClick={() => pick(on ? null : c.slug)}
                        className="group relative flex min-w-0 flex-col items-center gap-1.5 p-1 outline-2 -outline-offset-2 outline-transparent transition-colors hover:outline-border-strong aria-pressed:outline-accent"
                      >
                        {/* 이미지에 이름이 새겨져 있어 따로 글자를 달지 않는다 (이름은 title·alt 로) */}
                        <Portrait slug={c.slug} label={name(c.slug)} className="aspect-[575/625] w-full" />
                        {count > 0 && (
                          <span className="absolute top-1 right-1 min-w-5 bg-accent px-1.5 text-center text-xs leading-5 font-bold text-accent-fg">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** 캐릭터 이미지. 파일이 없으면 이름 카드로 대신한다 */
function Portrait({ slug, label, className }: { slug: string; label: string; className: string }) {
  const [broken, setBroken] = useState(false);
  const src = rosterImage(slug);
  if (broken || !src) {
    return (
      <span
        className={`${className} skew grid place-items-center bg-surface-2 text-center text-sm leading-tight font-bold text-muted`}
      >
        <span>{label}</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 공식 사이트 이미지, 펼쳤을 때만 불러온다
    <img
      src={src}
      alt={label}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`${className} object-contain`}
    />
  );
}
