import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorNames, getComboForEmbed, getLatestPatchId } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { normalizeNotation } from "@/lib/notation/parse";
import { linkedSetupsFor } from "@/lib/setup-links";
import { ComboCard } from "@/components/combo-card";
import { EmbedFooter } from "@/components/embed-footer";

export const revalidate = 3600;

async function load(lang: string, idText: string) {
  const id = Number(idText);
  if (!hasLocale(lang) || !Number.isInteger(id)) return null;
  return getComboForEmbed(id);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/embed/combo/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const found = await load(lang, id);
  if (!found || !hasLocale(lang)) return {};
  const { combo } = found;
  return { title: combo.title ? pickLocalized(combo.title, lang).text : normalizeNotation(combo.notation_classic) };
}

/** 콤보 퍼가기: 콤보 페이지의 카드와 같은 디자인·내용을 그대로 보여 준다 */
export default async function EmbedComboPage({ params }: PageProps<"/[lang]/embed/combo/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const found = await load(lang, id);
  if (!found) notFound();

  const { combo, character, setups, links } = found;
  const dict = getDictionary(lang);
  const [latestPatchId, authors] = await Promise.all([getLatestPatchId(), getAuthorNames()]);

  return (
    <div className="flex flex-col gap-2">
      <ComboCard
        combo={combo}
        locale={lang}
        dict={dict}
        latestPatchId={latestPatchId}
        authors={authors}
        characterSlug={character.slug}
        linkedSetups={linkedSetupsFor(combo.id, links, setups, lang, dict)}
        embedded
      />
      <EmbedFooter href={`/${character.slug}/combos#combo-${combo.id}`} label={dict.share.viewOnSite} />
    </div>
  );
}
