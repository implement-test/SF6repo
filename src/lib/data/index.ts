import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Character, Combo, Patch } from "@/lib/types";
import { sampleCharacters, sampleCombos, samplePatches } from "./sample";

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

export async function getCombos(characterId: number): Promise<Combo[]> {
  const c = db();
  if (!c) return sampleCombos.filter((combo) => combo.character_id === characterId);
  return rows<Combo>(c.from("combos").select("*").eq("character_id", characterId).order("sort_order"));
}
