import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";
import { pickLocalized } from "./i18n/localized";
import { normalizeNotation } from "./notation/parse";
import { comboRoutes } from "./combo-routes";
import type { Combo, ComboFinish, ComboRoute, Setup, SetupComboLink } from "./types";

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

/** 콤보 카드에 붙는 셋업 링크. 어느 루트(마무리)에서 이어지는지 함께 */
export type LinkedSetup = {
  id: number;
  title: string;
  preview: string;
  routeIndex: number;
  finishIndex: number | null;
};

/** 콤보 하나에 연결된 (공개) 셋업들을 콤보 카드에 넘길 모양으로 */
export function linkedSetupsFor(
  comboId: number,
  links: SetupComboLink[],
  setups: Setup[],
  locale: Locale,
  dict: Dictionary,
): LinkedSetup[] {
  const byId = new Map(setups.filter((s) => s.is_published).map((s) => [s.id, s]));
  return links
    .filter((l) => l.combo_id === comboId)
    .flatMap((l) => {
      const s = byId.get(l.setup_id);
      if (!s) return [];
      return [
        {
          id: s.id,
          title: pickLocalized(s.title, locale).text,
          preview: setupPreview(s, locale, dict),
          routeIndex: l.route_index ?? 0,
          finishIndex: l.finish_index ?? null,
        },
      ];
    });
}

/** 셋업 카드에 보여 줄 이어지는 콤보: 콤보와 그 루트 · 마무리 */
export type LinkedCombo = { combo: Combo; route: ComboRoute; routeIndex: number; finish: ComboFinish | null };

/**
 * 셋업 하나에 연결된 (공개) 콤보의 루트 · 마무리.
 * 콤보를 고친 뒤 루트 · 마무리가 없어졌으면 루트 1 · 마무리 없음으로 보여 준다.
 */
export function linkedCombosFor(setupId: number, links: SetupComboLink[], comboById: Map<number, Combo>): LinkedCombo[] {
  return links
    .filter((l) => l.setup_id === setupId)
    .flatMap((l) => {
      const combo = comboById.get(l.combo_id);
      if (!combo) return [];
      const routes = comboRoutes(combo);
      const routeIndex = routes[l.route_index ?? 0] ? (l.route_index ?? 0) : 0;
      const route = routes[routeIndex];
      const finish = l.finish_index !== null && l.finish_index !== undefined ? (route.finishes[l.finish_index] ?? null) : null;
      return [{ combo, route, routeIndex, finish }];
    });
}
