import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorNames, getLatestPatchId, getSetupForEmbed, getSetupSituations } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { SetupCard } from "@/components/setup-card";

export const revalidate = 3600;

async function load(lang: string, idText: string) {
  const id = Number(idText);
  if (!hasLocale(lang) || !Number.isInteger(id)) return null;
  return getSetupForEmbed(id);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/embed/setup/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const found = await load(lang, id);
  if (!found || !hasLocale(lang)) return {};
  return { title: pickLocalized(found.setup.title, lang).text };
}

/** 셋업 퍼가기: 셋업 페이지의 카드와 같은 디자인·내용을 그대로 보여 준다 */
export default async function EmbedSetupPage({ params }: PageProps<"/[lang]/embed/setup/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const found = await load(lang, id);
  if (!found) notFound();

  const { setup, character, linkedCombos } = found;
  const dict = getDictionary(lang);
  const [situations, latestPatchId, authors] = await Promise.all([
    getSetupSituations(),
    getLatestPatchId(),
    getAuthorNames(),
  ]);
  const situationNames = Object.fromEntries(situations.map((s) => [s.slug, pickLocalized(s.name, lang).text]));

  return (
    <div className="flex flex-col gap-2">
      <SetupCard
        setup={setup}
        locale={lang}
        dict={dict}
        situationNames={situationNames}
        linkedCombos={linkedCombos}
        latestPatchId={latestPatchId}
        authors={authors}
        characterSlug={character.slug}
        embedded
      />
      <a
        href={`/${character.slug}/setups#setup-${setup.id}`}
        target="_blank"
        rel="noopener"
        className="flex items-center justify-end gap-2 px-1 text-xs text-muted hover:text-accent"
      >
        <span className="display text-sm not-italic text-fg">
          SF6 <span className="text-accent">REPOSITORY</span>
        </span>
        {dict.share.viewOnSite} ↗
      </a>
    </div>
  );
}
