import { notFound } from "next/navigation";
import {
  getAuthorNames,
  getCharacter,
  getCombos,
  getLatestPatchId,
  getSetupComboLinks,
  getSetups,
} from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { linkedSetupsFor } from "@/lib/setup-links";
import { ComboCard } from "@/components/combo-card";
import { ComboFilters } from "@/components/combo-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

export const revalidate = 3600;

export default async function CombosPage({ params }: PageProps<"/[lang]/[character]/combos">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [combos, latestPatchId, authors, setups] = await Promise.all([
    getCombos(character.id),
    getLatestPatchId(),
    getAuthorNames(),
    getSetups(character.id),
  ]);
  const links = await getSetupComboLinks(setups.filter((s) => s.is_published).map((s) => s.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2 empty:hidden">
        <ReorderButton table="combos" characterId={character.id} label="콤보" />
        <AddButton entity="combo" label="콤보 추가" scope={character.id} defaults={{ character_id: character.id }} />
      </div>
      <DraftItems table="combos" entity="combo" characterId={character.id} label="콤보" />
      <ComboFilters
        dict={dict}
        items={combos
          .filter((c) => c.is_published)
          .map((combo) => ({
            id: combo.id,
            hitStates: combo.hit_states,
            positionStart: combo.position_start,
            card: (
              <ComboCard
                combo={combo}
                locale={lang}
                dict={dict}
                latestPatchId={latestPatchId}
                authors={authors}
                characterSlug={slug}
                linkedSetups={linkedSetupsFor(combo.id, links, setups, lang, dict)}
              />
            ),
          }))}
      />
    </div>
  );
}
