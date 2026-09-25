import type { Localized } from "@/lib/types";
import type { Locale } from "./config";

/**
 * 다국어 필드에서 현재 언어의 텍스트를 고른다.
 * 번역이 없으면 한국어 원문을 돌려주고 translated=false 로 표시한다 ('Not translated' 배지용).
 */
export function pickLocalized(value: Localized, locale: Locale): { text: string; translated: boolean } {
  const text = value[locale]?.trim();
  if (text) return { text, translated: true };
  return { text: value.ko, translated: locale === "ko" };
}
