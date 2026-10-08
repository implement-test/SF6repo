import { cleanNote } from "./combo-routes";
import type { Localized, VsPattern, VsPunish, VsResponse } from "./types";

/**
 * Vs 가이드의 상대 패턴 · 대응 (0027).
 * 저장된 값을 화면에서 쓸 모양으로 맞추고(normalize), 저장 전에 빈 것을 걸러 낸다(clean).
 */

const text = (v: unknown) => (typeof v === "string" ? v : "");
const textOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);
const numberOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const localized = (v: unknown): Localized | null =>
  v && typeof v === "object" && typeof (v as Localized).ko === "string" && (v as Localized).ko ? (v as Localized) : null;
const punishOf = (v: unknown): VsPunish | null => (v === "confirmed" || v === "range" ? v : null);

export const emptyResponse = (): VsResponse => ({ classic: "", modern: null, note: null, punish: null });

export const emptyPattern = (): VsPattern => ({
  classic: "",
  modern: null,
  name: null,
  note: null,
  frame_min: null,
  frame_max: null,
  youtube_url: null,
  youtube_start: null,
  youtube_end: null,
  youtube_loop: false,
  responses: [emptyResponse()],
});

function normalizeResponse(raw: unknown): VsResponse {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { classic: text(r.classic), modern: textOrNull(r.modern), note: localized(r.note), punish: punishOf(r.punish) };
}

function normalizePattern(raw: object): VsPattern {
  const p = raw as Record<string, unknown>;
  return {
    classic: text(p.classic),
    modern: textOrNull(p.modern),
    name: localized(p.name),
    note: localized(p.note),
    frame_min: numberOrNull(p.frame_min),
    frame_max: numberOrNull(p.frame_max),
    youtube_url: textOrNull(p.youtube_url),
    youtube_start: numberOrNull(p.youtube_start),
    youtube_end: numberOrNull(p.youtube_end),
    youtube_loop: p.youtube_loop === true,
    responses: (Array.isArray(p.responses) ? p.responses : []).map(normalizeResponse),
  };
}

/** 저장된 패턴 목록을 화면에 보일 모양으로 (표기도 설명도 없는 대응, 내용이 하나도 없는 패턴은 버린다) */
export function normalizeVsPatterns(raw: unknown): VsPattern[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const p = normalizePattern(v);
      return { ...p, responses: p.responses.filter((r) => r.classic || r.note) };
    })
    .filter((p) => p.classic || p.name || p.note || p.responses.length > 0);
}

/** 편집 창에서 쓸 모양 (작성 중인 빈 대응 · 패턴도 그대로 둔다) */
export function editableVsPatterns(raw: unknown): VsPattern[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v) => v && typeof v === "object").map(normalizePattern);
}

/**
 * 저장 전 정리: 빈 대응 · 패턴은 버리고 글자는 다듬는다.
 * 이름 · 설명에 한국어가 빠졌으면 "missing-ko", 구간 끝이 시작보다 앞이면 "bad-clip".
 */
export function cleanVsPatterns(list: VsPattern[] | null | undefined): VsPattern[] | "missing-ko" | "bad-clip" {
  const out: VsPattern[] = [];
  for (const p of list ?? []) {
    const name = cleanNote(p.name);
    const note = cleanNote(p.note);
    if (name === "missing-ko" || note === "missing-ko") return "missing-ko";
    const responses: VsResponse[] = [];
    for (const r of p.responses ?? []) {
      const rNote = cleanNote(r.note);
      if (rNote === "missing-ko") return "missing-ko";
      const classic = r.classic.trim();
      if (!classic && !rNote) continue;
      responses.push({ classic, modern: r.modern?.trim() || null, note: rNote, punish: punishOf(r.punish) });
    }
    const classic = p.classic.trim();
    if (!classic && !name && !note && responses.length === 0) continue;
    const youtube_url = p.youtube_url?.trim() || null;
    const start = youtube_url ? numberOrNull(p.youtube_start) : null;
    const end = youtube_url ? numberOrNull(p.youtube_end) : null;
    if (end !== null && end <= (start ?? 0)) return "bad-clip";
    out.push({
      classic,
      modern: p.modern?.trim() || null,
      name,
      note,
      frame_min: numberOrNull(p.frame_min),
      frame_max: numberOrNull(p.frame_max),
      youtube_url,
      youtube_start: start,
      youtube_end: end,
      youtube_loop: !!youtube_url && end !== null && p.youtube_loop === true,
      responses,
    });
  }
  return out;
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** 프레임 범위 표시: "-8 ~ -12", 하나만 있거나 같으면 "-8", 없으면 null */
export function formatFrameRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min === null || max === null || min === max) return signed((min ?? max)!);
  return `${signed(min)} ~ ${signed(max)}`;
}
