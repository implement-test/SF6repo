import { notFound } from "next/navigation";
import { getAuthorNames, getCharacter, getCombos, getLatestPatchId } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ComboCard } from "@/components/combo-card";
import { ComboFilters } from "@/components/combo-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftCombos } from "@/components/admin/drafts";

export const revalidate = 3600;

export default async function CombosPage({ params }: PageProps<"/[lang]/[character]/combos">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [combos, latestPatchId, authors] = await Promise.all([
    getCombos(character.id),
    getLatestPatchId(),
    getAuthorNames(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end empty:hidden">
        <AddButton entity="combo" label="콤보 추가" scope={character.id} defaults={{ character_id: character.id }} />
      </div>
      <DraftCombos characterId={character.id} />
      <ComboFilters
        dict={dict}
        items={combos
          .filter((c) => c.is_published)
          .map((combo) => ({
            id: combo.id,
            hitStates: combo.hit_states,
            positionStart: combo.position_start,
            card: <ComboCard combo={combo} locale={lang} dict={dict} latestPatchId={latestPatchId} authors={authors} />,
          }))}
      />
    </div>
  );
}
