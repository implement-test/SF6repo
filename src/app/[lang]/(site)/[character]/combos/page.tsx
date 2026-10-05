import { notFound } from "next/navigation";
import {
  getAuthorNames,
  getCharacter,
  getComboGroups,
  getCombos,
  getLatestPatchId,
  getEnders,
  getSetupEnders,
  getSetups,
} from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { pickLocalized } from "@/lib/i18n/localized";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { linkedSetupsFor } from "@/lib/setup-links";
import { comboEnderIds } from "@/lib/enders";
import { ComboCard } from "@/components/combo-card";
import { ComboFilters } from "@/components/combo-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";
import { EnderButton } from "@/components/admin/ender-button";

export const revalidate = 3600;

export default async function CombosPage({ params }: PageProps<"/[lang]/[character]/combos">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [combos, groups, enders, latestPatchId, authors, setups] = await Promise.all([
    getCombos(character.id),
    getComboGroups(character.id),
    getEnders(character.id),
    getLatestPatchId(),
    getAuthorNames(),
    getSetups(character.id),
  ]);
  const links = await getSetupEnders(setups.filter((s) => s.is_published).map((s) => s.id));

  // 관리자 버튼: 목록 위와 아래에 같은 것을 둔다 (방문자에게는 비어서 숨는다)
  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <EnderButton characterId={character.id} />
      <ReorderButton table="combos" characterId={character.id} label="콤보" />
      <AddButton entity="combo" label="콤보 추가" scope={character.id} defaults={{ character_id: character.id }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="combos" entity="combo" characterId={character.id} label="콤보" />
      <ComboFilters
        dict={dict}
        characterId={character.id}
        groups={groups.map((g) => ({ id: g.id, name: pickLocalized(g.name, lang).text }))}
        enders={enders.map((e) => ({
          id: e.id,
          notation: e.notation_classic,
          label: e.label ? pickLocalized(e.label, lang).text : null,
        }))}
        items={combos
          .filter((c) => c.is_published)
          .map((combo) => ({
            id: combo.id,
            level: combo.target_level,
            hitStates: combo.hit_states,
            positionStart: combo.position_start,
            groupId: combo.group_id ?? null,
            enderIds: comboEnderIds(combo, enders),
            card: (
              <ComboCard
                combo={combo}
                locale={lang}
                dict={dict}
                latestPatchId={latestPatchId}
                authors={authors}
                characterSlug={slug}
                enders={enders}
                linkedSetups={linkedSetupsFor(combo, enders, links, setups, lang, dict)}
              />
            ),
          }))}
      />
      {adminActions}
    </div>
  );
}
