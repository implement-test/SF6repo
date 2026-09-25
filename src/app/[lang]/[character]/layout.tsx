import { notFound } from "next/navigation";
import { getCharacter, getCharacters, getPatches } from "@/lib/data";
import { LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { ContentFilters } from "@/components/prefs-controls";
import { CharacterNav } from "@/components/character-nav";
import { formatPatchVersion } from "@/lib/patch";

export async function generateStaticParams() {
  const characters = await getCharacters();
  return LOCALES.flatMap((lang) => characters.map((c) => ({ lang, character: c.slug })));
}

export default async function CharacterLayout({ children, params }: LayoutProps<"/[lang]/[character]">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const [character, patches] = await Promise.all([getCharacter(slug), getPatches()]);
  if (!character) notFound();
  const dict = getDictionary(lang);
  const name = pickLocalized(character.name, lang).text;
  const latest = patches[0];

  return (
    <div className="flex flex-col gap-5">
      <section className="stripes relative -mx-4 overflow-hidden border-y border-border bg-surface px-4 sm:mx-0 sm:border-x">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3"
          style={{ background: "linear-gradient(100deg, transparent 20%, color-mix(in srgb, var(--accent) 22%, transparent))" }}
        />
        {character.portrait_url && (
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-right-top opacity-80"
            style={{
              backgroundImage: `url(${character.portrait_url})`,
              maskImage: "linear-gradient(90deg, transparent, black 40%)",
            }}
          />
        )}
        <div className="relative flex flex-wrap items-end justify-between gap-4 py-7 sm:px-4">
          <div>
            <p className="eyebrow">Character</p>
            <h1 className="display mt-1 text-5xl uppercase sm:text-6xl">{name}</h1>
          </div>
          {latest && (
            <div className="skew bg-highlight px-3 py-1 text-highlight-fg">
              <span className="display text-sm not-italic">{formatPatchVersion(latest.version)}</span>
            </div>
          )}
        </div>
      </section>

      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-border bg-bg/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <CharacterNav slug={slug} labels={dict.nav} />
      </div>

      <ContentFilters dict={dict} />

      <div>{children}</div>
    </div>
  );
}
