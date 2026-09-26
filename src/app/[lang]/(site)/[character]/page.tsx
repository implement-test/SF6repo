import { notFound } from "next/navigation";
import { getCharacter, getLatestPatchId, getOverview } from "@/lib/data";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import type { Localized } from "@/lib/types";
import { NotTranslatedBadge, OutdatedBadge } from "@/components/badges";
import { AddButton, EditButton } from "@/components/admin/admin-context";

export const revalidate = 3600;

/** 개요: 캐릭터 소개 → 장점 / 단점 → 클래식·모던 차이 (supercombo 위키 캐릭터 페이지 구성 참고) */
export default async function OverviewPage({ params }: PageProps<"/[lang]/[character]">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [overview, latestPatchId] = await Promise.all([getOverview(character.id), getLatestPatchId()]);
  const shown = overview && overview.is_published ? overview : null;
  const summary = shown?.summary ? pickLocalized(shown.summary, lang) : null;
  const outdated = shown && latestPatchId !== null && shown.patch_id !== latestPatchId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2 empty:hidden">
        {overview ? (
          <EditButton entity="overview" id={overview.id} scope={character.id} label="개요 수정" />
        ) : (
          <AddButton entity="overview" label="개요 작성" scope={character.id} defaults={{ character_id: character.id }} />
        )}
      </div>

      {!shown ? (
        <p className="border border-dashed border-border py-12 text-center text-muted">{dict.overview.empty}</p>
      ) : (
        <>
          {summary && (
            <section className="relative border border-border bg-surface py-4 pr-4 pl-5">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />
              <header className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="eyebrow">{dict.overview.summary}</h2>
                {!summary.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                {outdated && <OutdatedBadge label={dict.patch.outdated} />}
              </header>
              <p className="leading-relaxed whitespace-pre-line">{summary.text}</p>
            </section>
          )}

          {(shown.pros.length > 0 || shown.cons.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <PointList title={dict.overview.pros} items={shown.pros} tone="pro" locale={lang} notTranslated={dict.notTranslated} />
              <PointList title={dict.overview.cons} items={shown.cons} tone="con" locale={lang} notTranslated={dict.notTranslated} />
            </div>
          )}

          {shown.modern_notes.length > 0 && (
            <PointList
              title={dict.overview.modern}
              items={shown.modern_notes}
              tone="note"
              locale={lang}
              notTranslated={dict.notTranslated}
            />
          )}
        </>
      )}
    </div>
  );
}

const TONES = {
  pro: { color: "var(--drive)", marker: "+" },
  con: { color: "var(--warn)", marker: "−" },
  note: { color: "var(--muted)", marker: "·" },
} as const;

/** 장점 / 단점 / 차이: 한 줄씩 표시 */
function PointList({
  title,
  items,
  tone,
  locale,
  notTranslated,
}: {
  title: string;
  items: Localized[];
  tone: keyof typeof TONES;
  locale: Locale;
  notTranslated: string;
}) {
  const { color, marker } = TONES[tone];
  return (
    <section className="border border-border bg-surface">
      <h2 className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-bold">
        <span aria-hidden className="skew inline-block h-3.5 w-1" style={{ background: color }} />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">—</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item, i) => {
            const text = pickLocalized(item, locale);
            return (
              <li key={i} className="flex gap-3 px-4 py-2.5 text-sm">
                <span aria-hidden className="display w-3 shrink-0 text-center" style={{ color }}>
                  {marker}
                </span>
                <span className="min-w-0">
                  {text.text} {!text.translated && <NotTranslatedBadge label={notTranslated} />}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
