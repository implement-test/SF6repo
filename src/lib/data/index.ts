import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Character,
  CharacterOverview,
  Combo,
  ComboGroup,
  Move,
  Patch,
  Practice,
  Setup,
  ComboEnder,
  SetupEnderLink,
  SetupSituation,
  Video,
  VsGuide,
} from "@/lib/types";
import { normalizeOptions, normalizePractice } from "@/lib/setup";
import { normalizeStarterGroups } from "@/lib/starters";
import { normalizeVsPatterns } from "@/lib/vs-patterns";
import { linkedEndersFor, type LinkedEnder } from "@/lib/setup-links";
import {
  sampleCharacters,
  sampleCombos,
  samplePatches,
  sampleEnders,
  sampleSetupEnders,
  sampleSetups,
  sampleSituations,
  sampleMoves,
  sampleOverviews,
  sampleVideos,
  sampleVsGuides,
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
  const list = await rows<Combo>(c.from("combos").select("*").eq("character_id", characterId).order("sort_order").order("id"));
  // 예전 형식(시동기 목록)도 그룹 목록으로 맞춘다.
  return list.map((cb) => ({ ...cb, starters: normalizeStarterGroups(cb.starters) }));
}

/** 콤보 그룹 (0021). 표가 아직 없으면 그룹 없이 보여 준다 */
export async function getComboGroups(characterId: number): Promise<ComboGroup[]> {
  const c = db();
  if (!c) return [];
  const { data, error } = await c
    .from("combo_groups")
    .select("id,character_id,name,sort_order")
    .eq("character_id", characterId)
    .order("sort_order")
    .order("id");
  if (error) return [];
  return (data ?? []) as ComboGroup[];
}

/** 추천 연습 (0022). 표가 아직 없으면 빈 목록 */
export async function getPractices(characterId: number): Promise<Practice[]> {
  const c = db();
  if (!c) return [];
  const { data, error } = await c
    .from("practices")
    .select("*")
    .eq("character_id", characterId)
    .order("sort_order")
    .order("id");
  if (error) return [];
  return ((data ?? []) as Practice[]).map((p) => ({
    ...p,
    options: normalizeOptions(p.options),
    practice: normalizePractice(p.practice),
  }));
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
 * 퍼가기(embed) 페이지용: 공개된 셋업 하나와, 카드에 필요한 캐릭터 · 이어지는 엔더.
 * 없거나 비공개면 null.
 */
export async function getSetupForEmbed(
  id: number,
): Promise<{ setup: Setup; character: Character; linkedEnders: LinkedEnder[] } | null> {
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
  const [links, enders, combos] = await Promise.all([
    getSetupEnders([setup.id]),
    getEnders(character.id),
    getCombos(character.id),
  ]);
  return { setup, character, linkedEnders: linkedEndersFor(setup.id, links, enders, combos) };
}

/**
 * 퍼가기(embed) 페이지용: 공개된 콤보 하나와, 카드에 필요한 캐릭터 · 엔더 · 이어지는 셋업.
 * 없거나 비공개면 null.
 */
export async function getComboForEmbed(id: number): Promise<{
  combo: Combo;
  character: Character;
  setups: Setup[];
  enders: ComboEnder[];
  links: SetupEnderLink[];
} | null> {
  const c = db();
  let combo: Combo | undefined;
  if (!c) combo = sampleCombos.find((cb) => cb.id === id);
  else {
    const { data } = await c.from("combos").select("*").eq("id", id).maybeSingle();
    combo = data ? { ...data, starters: normalizeStarterGroups(data.starters) } : undefined;
  }
  if (!combo || !combo.is_published) return null;

  const character = (await getCharacters()).find((ch) => ch.id === combo.character_id);
  if (!character) return null;
  const [setups, enders] = await Promise.all([
    getSetups(character.id).then((list) => list.filter((s) => s.is_published)),
    getEnders(character.id),
  ]);
  const links = await getSetupEnders(setups.map((s) => s.id));
  return { combo, character, setups, enders, links };
}

/** 엔더 목록 (0025). 표가 아직 없으면 빈 목록 */
export async function getEnders(characterId: number): Promise<ComboEnder[]> {
  const c = db();
  if (!c) return sampleEnders.filter((e) => e.character_id === characterId);
  const { data, error } = await c
    .from("combo_enders")
    .select("*")
    .eq("character_id", characterId)
    .order("sort_order")
    .order("id");
  if (error) return [];
  return (data ?? []) as ComboEnder[];
}

/** 셋업 ↔ 엔더 연결 (이 셋업들만). 표가 없거나 실패해도 페이지는 그대로 보여 준다 */
export async function getSetupEnders(setupIds: number[]): Promise<SetupEnderLink[]> {
  const c = db();
  if (!c) return sampleSetupEnders.filter((l) => setupIds.includes(l.setup_id));
  if (setupIds.length === 0) return [];
  const { data } = await c.from("setup_enders").select("*").in("setup_id", setupIds).order("sort_order");
  return (data ?? []) as SetupEnderLink[];
}

/** Vs 가이드 (이 캐릭터가 상대를 만났을 때). 표가 아직 없으면(0014 실행 전) 빈 목록 */
export async function getVsGuides(characterId: number): Promise<VsGuide[]> {
  const c = db();
  if (!c) return sampleVsGuides.filter((g) => g.character_id === characterId);
  const { data } = await c
    .from("vs_guides")
    .select("*")
    .eq("character_id", characterId)
    .order("sort_order")
    .order("id");
  return ((data ?? []) as VsGuide[]).map((g) => ({ ...g, patterns: normalizeVsPatterns(g.patterns) }));
}

const localizedList = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && x.ko) : []);

/** 캐릭터 개요 (없으면 null). 표가 아직 없으면(0016 실행 전) null */
export async function getOverview(characterId: number): Promise<CharacterOverview | null> {
  const c = db();
  if (!c) return sampleOverviews.find((o) => o.character_id === characterId) ?? null;
  const { data } = await c.from("character_overviews").select("*").eq("character_id", characterId).maybeSingle();
  if (!data) return null;
  return {
    ...data,
    pros: localizedList(data.pros),
    cons: localizedList(data.cons),
    modern_notes: localizedList(data.modern_notes),
  } as CharacterOverview;
}

/** 커맨드 리스트 */
export async function getMoves(characterId: number): Promise<Move[]> {
  const c = db();
  if (!c) return sampleMoves.filter((m) => m.character_id === characterId);
  const { data } = await c.from("moves").select("*").eq("character_id", characterId).order("sort_order").order("id");
  return (data ?? []) as Move[];
}

/** 추천 영상. 표가 아직 없으면(0020 실행 전) 빈 목록 */
export async function getVideos(characterId: number): Promise<Video[]> {
  const c = db();
  if (!c) return sampleVideos.filter((v) => v.character_id === characterId);
  const { data } = await c.from("videos").select("*").eq("character_id", characterId).order("sort_order").order("id");
  return (data ?? []) as Video[];
}
