import { notFound } from "next/navigation";
import {
  getAuthorNames,
  getCharacter,
  getCombos,
  getLatestPatchId,
  getEnders,
  getSetupEnders,
  getSetupSituations,
  getSetups,
} from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { linkedEndersFor } from "@/lib/setup-links";
import { SetupCard } from "@/components/setup-card";
import { SetupFilters } from "@/components/setup-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";
import { EnderButton } from "@/components/admin/ender-button";

export const revalidate = 3600;

export default async function SetupsPage({ params }: PageProps<"/[lang]/[character]/setups">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [setups, combos, enders, situations, latestPatchId, authors] = await Promise.all([
    getSetups(character.id),
    getCombos(character.id),
    getEnders(character.id),
    getSetupSituations(),
    getLatestPatchId(),
    getAuthorNames(),
  ]);
  const published = setups.filter((s) => s.is_published);
  const links = await getSetupEnders(published.map((s) => s.id));
  const situationNames = Object.fromEntries(situations.map((s) => [s.slug, pickLocalized(s.name, lang).text]));

  // 관리자 버튼: 목록 위와 아래에 같은 것을 둔다 (방문자에게는 비어서 숨는다)
  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <EnderButton characterId={character.id} />
      <ReorderButton table="setups" characterId={character.id} label="셋업" />
      <AddButton entity="setup" label="셋업 추가" scope={character.id} defaults={{ character_id: character.id }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="setups" entity="setup" characterId={character.id} label="셋업" />
      <SetupFilters
        dict={dict}
        characterId={character.id}
        situations={situations.map((s) => ({ slug: s.slug, name: situationNames[s.slug] }))}
        items={published.map((setup) => ({
          id: setup.id,
          level: setup.target_level,
          situations: setup.situations,
          card: (
            <SetupCard
              setup={setup}
              locale={lang}
              dict={dict}
              situationNames={situationNames}
              linkedEnders={linkedEndersFor(setup.id, links, enders, combos)}
              latestPatchId={latestPatchId}
              authors={authors}
              characterSlug={slug}
            />
          ),
        }))}
      />
      {adminActions}
    </div>
  );
}
