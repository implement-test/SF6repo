import { notFound } from "next/navigation";
import {
  getAuthorNames,
  getCharacter,
  getCombos,
  getLatestPatchId,
  getSetupComboLinks,
  getSetupSituations,
  getSetups,
} from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { SetupCard } from "@/components/setup-card";
import { SetupFilters } from "@/components/setup-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

export const revalidate = 3600;

export default async function SetupsPage({ params }: PageProps<"/[lang]/[character]/setups">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [setups, combos, situations, latestPatchId, authors] = await Promise.all([
    getSetups(character.id),
    getCombos(character.id),
    getSetupSituations(),
    getLatestPatchId(),
    getAuthorNames(),
  ]);
  const published = setups.filter((s) => s.is_published);
  const links = await getSetupComboLinks(published.map((s) => s.id));
  const comboById = new Map(combos.filter((c) => c.is_published).map((c) => [c.id, c]));
  const situationNames = Object.fromEntries(situations.map((s) => [s.slug, pickLocalized(s.name, lang).text]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2 empty:hidden">
        <ReorderButton table="setups" characterId={character.id} label="셋업" />
        <AddButton entity="setup" label="셋업 추가" scope={character.id} defaults={{ character_id: character.id }} />
      </div>
      <DraftItems table="setups" entity="setup" characterId={character.id} label="셋업" />
      <SetupFilters
        dict={dict}
        characterId={character.id}
        situations={situations.map((s) => ({ slug: s.slug, name: situationNames[s.slug] }))}
        items={published.map((setup) => ({
          id: setup.id,
          situations: setup.situations,
          card: (
            <SetupCard
              setup={setup}
              locale={lang}
              dict={dict}
              situationNames={situationNames}
              linkedCombos={links
                .filter((l) => l.setup_id === setup.id)
                .map((l) => comboById.get(l.combo_id))
                .filter((c) => c !== undefined)}
              latestPatchId={latestPatchId}
              authors={authors}
              characterSlug={slug}
            />
          ),
        }))}
      />
    </div>
  );
}
