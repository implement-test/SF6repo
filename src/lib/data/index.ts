import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Character, Combo, Patch, Setup, SetupComboLink, SetupSituation } from "@/lib/types";
import { normalizeOptions, normalizePractice } from "@/lib/setup";
import {
  sampleCharacters,
  sampleCombos,
  samplePatches,
  sampleSetupLinks,
  sampleSetups,
  sampleSituations,
} from "./sample";

/**
 * 방문자 페이지용 데이터 조회.
 * 쿠키 없이 anon 키로 읽기 때문에 페이지를 정적으로 생성(ISR)할 수 있다.
 * 환경변수가 없으면 sample.ts 의 예시 데이터를 쓴다.
 */

let client: SupabaseClient | null | undefined;

function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // SF6_SAMPLE_DATA=1 이면 DB 가 연결돼 있어도 예시 데이터로 화면을 확인한다 (개발용).
  const useSample = process.env.SF6_SAMPLE_DATA === "1";
  client = url && key && !useSample ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCharacters(): Promise<Character[]> {
  const c = db();
  if (!c) return sampleCharacters;
  return rows<Character>(c.from("characters").select("*").order("sort_order"));
}

export async function getCharacter(slug: string): Promise<Character | null> {
  return (await getCharacters()).find((ch) => ch.slug === slug) ?? null;
}

export async function getPatches(): Promise<Patch[]> {
  const c = db();
  if (!c) return samplePatches;
  return rows<Patch>(c.from("patches").select("*").order("released_on", { ascending: false }));
}

/** 가장 최근 패치 id. 항목의 patch_id 가 이것과 다르면 "이전 패치 기준" 배지를 띄운다. */
export async function getLatestPatchId(): Promise<number | null> {
  return (await getPatches())[0]?.id ?? null;
}

/** 관리자 user_id → 표시 이름 (작성자 표시용) */
export async function getAuthorNames(): Promise<Record<string, string>> {
  const c = db();
  if (!c) return {};
  // 작성자 이름은 부가 정보라서, 조회에 실패해도 페이지는 그대로 보여 준다.
  const { data } = await c.from("author_names").select("*");
  return Object.fromEntries((data ?? []).map((a: { user_id: string; display_name: string }) => [a.user_id, a.display_name]));
}

export async function getCombos(characterId: number): Promise<Combo[]> {
  const c = db();
  if (!c) return sampleCombos.filter((combo) => combo.character_id === characterId);
  return rows<Combo>(c.from("combos").select("*").eq("character_id", characterId).order("sort_order"));
}

export async function getSetupSituations(): Promise<SetupSituation[]> {
  const c = db();
  if (!c) return sampleSituations;
  return rows<SetupSituation>(c.from("setup_situations").select("*").order("sort_order"));
}

export async function getSetups(characterId: number): Promise<Setup[]> {
  const c = db();
  if (!c) return sampleSetups.filter((s) => s.character_id === characterId);
  const list = await rows<Setup>(
    c.from("setups").select("*").eq("character_id", characterId).order("sort_order").order("id"),
  );
  // 이전 형식으로 저장된 옵션·프랙티스 설정도 현재 형식으로 맞춘다.
  return list.map((s) => ({ ...s, options: normalizeOptions(s.options), practice: normalizePractice(s.practice) }));
}

/**
 * 퍼가기(embed) 페이지용: 공개된 셋업 하나와, 카드에 필요한 캐릭터 · 연결 콤보.
 * 없거나 비공개면 null.
 */
export async function getSetupForEmbed(
  id: number,
): Promise<{ setup: Setup; character: Character; linkedCombos: Combo[] } | null> {
  const c = db();
  let setup: Setup | undefined;
  if (!c) {
    setup = sampleSetups.find((s) => s.id === id);
  } else {
    const { data } = await c.from("setups").select("*").eq("id", id).maybeSingle();
    if (data) setup = { ...data, options: normalizeOptions(data.options), practice: normalizePractice(data.practice) };
  }
  if (!setup || !setup.is_published) return null;

  const character = (await getCharacters()).find((ch) => ch.id === setup.character_id);
  if (!character) return null;
  const [links, combos] = await Promise.all([getSetupComboLinks([setup.id]), getCombos(character.id)]);
  const byId = new Map(combos.filter((cb) => cb.is_published).map((cb) => [cb.id, cb]));
  const linkedCombos = links.map((l) => byId.get(l.combo_id)).filter((cb) => cb !== undefined);
  return { setup, character, linkedCombos };
}

/** 셋업 ↔ 콤보 연결 (이 캐릭터의 셋업만). 연결 표가 없거나 실패해도 페이지는 그대로 보여 준다. */
export async function getSetupComboLinks(setupIds: number[]): Promise<SetupComboLink[]> {
  const c = db();
  if (!c) return sampleSetupLinks.filter((l) => setupIds.includes(l.setup_id));
  if (setupIds.length === 0) return [];
  const { data } = await c.from("setup_combos").select("*").in("setup_id", setupIds).order("sort_order");
  return (data ?? []) as SetupComboLink[];
}
