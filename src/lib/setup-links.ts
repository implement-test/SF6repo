import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";
import { pickLocalized } from "./i18n/localized";
import { normalizeNotation } from "./notation/parse";
import type { Setup, SetupComboLink } from "./types";

/** 콤보 카드의 셋업 링크에 마우스를 올렸을 때 보여 줄 텍스트 */
export function setupPreview(setup: Setup, locale: Locale, dict: Dictionary): string {
  const lines = [pickLocalized(setup.title, locale).text];
  if (setup.notation_classic) lines.push(`${dict.setup.input}: ${normalizeNotation(setup.notation_classic)}`);
  for (const o of setup.options) {
    const desc = o.description ? ` — ${pickLocalized(o.description, locale).text}` : "";
    lines.push(`${o.label}: ${normalizeNotation(o.classic)}${desc}`);
  }
  return lines.join("\n");
}

/** 콤보 하나에 연결된 (공개) 셋업들을 콤보 카드에 넘길 모양으로 */
export function linkedSetupsFor(
  comboId: number,
  links: SetupComboLink[],
  setups: Setup[],
  locale: Locale,
  dict: Dictionary,
): { id: number; title: string; preview: string }[] {
  const byId = new Map(setups.filter((s) => s.is_published).map((s) => [s.id, s]));
  return links
    .filter((l) => l.combo_id === comboId)
    .map((l) => byId.get(l.setup_id))
    .filter((s) => s !== undefined)
    .map((s) => ({ id: s.id, title: pickLocalized(s.title, locale).text, preview: setupPreview(s, locale, dict) }));
}
