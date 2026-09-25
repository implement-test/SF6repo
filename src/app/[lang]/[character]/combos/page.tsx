import { notFound } from "next/navigation";
import {
  getAuthorNames,
  getCharacter,
  getCombos,
  getLatestPatchId,
  getSetupComboLinks,
  getSetups,
} from "@/lib/data";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { normalizeNotation } from "@/lib/notation/parse";
import type { Setup } from "@/lib/types";
import { ComboCard } from "@/components/combo-card";
import { ComboFilters } from "@/components/combo-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";

export const revalidate = 3600;

/** 콤보 카드의 셋업 링크에 마우스를 올렸을 때 보여 줄 텍스트 */
function setupPreview(setup: Setup, locale: Locale, dict: Dictionary): string {
  const lines = [pickLocalized(setup.title, locale).text];
  if (setup.notation_classic) lines.push(`${dict.setup.input}: ${normalizeNotation(setup.notation_classic)}`);
  for (const o of setup.options) {
    const desc = o.description ? ` — ${pickLocalized(o.description, locale).text}` : "";
    lines.push(`${o.label}: ${normalizeNotation(o.classic)}${desc}`);
  }
  return lines.join("\n");
}

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
  const publishedSetups = setups.filter((s) => s.is_published);
  const links = await getSetupComboLinks(publishedSetups.map((s) => s.id));
  const setupById = new Map(publishedSetups.map((s) => [s.id, s]));
  const setupsFor = (comboId: number) =>
    links
      .filter((l) => l.combo_id === comboId)
      .map((l) => setupById.get(l.setup_id))
      .filter((s) => s !== undefined)
      .map((s) => ({ id: s.id, title: pickLocalized(s.title, lang).text, preview: setupPreview(s, lang, dict) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end empty:hidden">
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
                linkedSetups={setupsFor(combo.id)}
              />
            ),
          }))}
      />
    </div>
  );
}
