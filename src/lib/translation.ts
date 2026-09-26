/**
 * 한 항목 안의 모든 다국어 글({ko, en?, ja?})을 찾아 영어·일본어가 빠진 곳을 센다.
 * 제목·내용뿐 아니라 루트 메모, 셋업 옵션, Vs 선택지, 장점·단점 줄 같은 안쪽 글까지 본다.
 */
export function countMissingTranslations(value: unknown, out = { en: 0, ja: 0 }): { en: number; ja: number } {
  if (Array.isArray(value)) {
    for (const v of value) countMissingTranslations(v, out);
  } else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.ko === "string" && obj.ko.trim()) {
      if (typeof obj.en !== "string" || !obj.en.trim()) out.en++;
      if (typeof obj.ja !== "string" || !obj.ja.trim()) out.ja++;
    } else {
      for (const v of Object.values(obj)) countMissingTranslations(v, out);
    }
  }
  return out;
}
