import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";
import { pickLocalized } from "./i18n/localized";
import { displayNotation } from "./notation/parse";
import { setupVariants } from "./setup";
import { comboEnderIds, comboEnds } from "./enders";
import type { Combo, ComboEnder, Setup, SetupEnderLink } from "./types";
import { plainTitle } from "./title";

/** 셋업의 탭 이름: 이름이 없으면 "셋업 n" (포스트에 셋업이 하나면 null) */
export function variantName(setup: Setup, index: number, locale: Locale, dict: Dictionary): string | null {
  const variants = setupVariants(setup);
  if (variants.length < 2) return null;
  const name = variants[index]?.name;
  return name ? pickLocalized(name, locale).text : dict.setup.variant.replace("{n}", String(index + 1));
}

/** 콤보 카드의 셋업 링크에 마우스를 올렸을 때 보여 줄 텍스트 (포스트 제목 + 그 셋업) */
export function setupPreview(setup: Setup, locale: Locale, dict: Dictionary, index = 0): string {
  const name = variantName(setup, index, locale, dict);
  const lines = [plainTitle(pickLocalized(setup.title, locale).text) + (name ? ` · ${name}` : "")];
  const variants = setupVariants(setup);
  const variant = variants[index] ?? variants[0];
  if (variant.notation_classic) lines.push(`${dict.setup.input}: ${displayNotation(variant.notation_classic)}`);
  for (const o of variant.options) {
    const desc = o.description ? ` — ${pickLocalized(o.description, locale).text}` : "";
    lines.push(`${o.label}: ${displayNotation(o.classic)}${desc}`);
  }
  return lines.join("\n");
}

/** 콤보 카드에 붙는 셋업 링크. 어느 루트(마무리)에서 이어지는지, 포스트의 몇 번째 셋업인지 함께 */
export type LinkedSetup = {
  id: number;
  /** 포스트 안의 셋업 (0부터) */
  variant: number;
  title: string;
  preview: string;
  routeIndex: number;
  finishIndex: number | null;
};

/** 셋업 페이지에서 그 셋업(탭)으로 가는 주소의 # 부분 (첫 번째 셋업은 포스트 자체) */
export const setupAnchor = (id: number, variant: number) => (variant > 0 ? `setup-${id}-v${variant + 1}` : `setup-${id}`);

/**
 * 콤보의 루트 · 마무리마다, 그 엔더에 연결된 (공개) 셋업.
 * 셋업은 엔더에 연결되므로 시동 · 루트가 달라도 같은 기술로 끝나면 같은 셋업이 붙는다.
 */
export function linkedSetupsFor(
  combo: Combo,
  enders: ComboEnder[],
  links: SetupEnderLink[],
  setups: Setup[],
  locale: Locale,
  dict: Dictionary,
): LinkedSetup[] {
  const byId = new Map(setups.filter((s) => s.is_published).map((s) => [s.id, s]));
  return comboEnds(combo, enders).flatMap((end) => {
    if (!end.ender) return [];
    return links
      .filter((l) => l.ender_id === end.ender!.id)
      .flatMap((l) => {
        const s = byId.get(l.setup_id);
        if (!s) return [];
        return [
          {
            id: s.id,
            variant: l.variant ?? 0,
            title: [plainTitle(pickLocalized(s.title, locale).text), variantName(s, l.variant ?? 0, locale, dict)]
              .filter(Boolean)
              .join(" · "),
            preview: setupPreview(s, locale, dict, l.variant ?? 0),
            routeIndex: end.routeIndex,
            finishIndex: end.finishIndex,
          },
        ];
      });
  });
}

/** 셋업 카드에 보여 줄 엔더: 엔더와 그 엔더로 끝나는 (공개) 콤보 수, 포스트의 몇 번째 셋업으로 이어지는지 */
export type LinkedEnder = { ender: ComboEnder; comboCount: number; variant: number };

export function linkedEndersFor(
  setupId: number,
  links: SetupEnderLink[],
  enders: ComboEnder[],
  combos: Combo[],
): LinkedEnder[] {
  const byId = new Map(enders.map((e) => [e.id, e]));
  const published = combos.filter((c) => c.is_published);
  const usage = new Map<number, number>();
  for (const combo of published) for (const id of comboEnderIds(combo, enders)) usage.set(id, (usage.get(id) ?? 0) + 1);
  return links
    .filter((l) => l.setup_id === setupId)
    .flatMap((l) => {
      const ender = byId.get(l.ender_id);
      return ender ? [{ ender, comboCount: usage.get(ender.id) ?? 0, variant: l.variant ?? 0 }] : [];
    });
}
