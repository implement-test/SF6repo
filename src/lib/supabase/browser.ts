import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 관리자 화면 전용 브라우저 클라이언트.
 * 방문자 페이지에서는 불러오지 않도록 반드시 동적 import 로만 쓴다.
 * 세션은 localStorage 에 저장된다 (서버에서 세션을 읽을 일이 없으므로 쿠키가 필요 없다).
 */
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return client;
}

export type AdminRole = "super" | "sub" | "character";

export type AdminInfo = {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string;
  /** 캐릭터 관리자가 맡은 캐릭터 (최고/부 관리자는 모든 캐릭터를 편집할 수 있으므로 비어 있어도 된다) */
  characterIds: number[];
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super: "최고 관리자",
  sub: "부 관리자",
  character: "캐릭터 관리자",
};

/**
 * 로그인한 계정의 관리자 정보. 관리자가 아니거나 로그인하지 않았으면 null.
 * 조회 자체가 실패하면(네트워크, DB 오류) 관리자가 아니라고 단정하지 않고 예외를 던진다.
 */
export async function getAdminInfo(sb: SupabaseClient): Promise<AdminInfo | null> {
  const { data: session } = await sb.auth.getSession();
  const user = session.session?.user;
  if (!user) return null;
  const [{ data: me, error: meError }, { data: chars, error: charsError }] = await Promise.all([
    sb.from("admins").select("role,display_name").eq("user_id", user.id).maybeSingle(),
    sb.from("admin_characters").select("character_id").eq("user_id", user.id),
  ]);
  if (meError || charsError) throw new Error((meError ?? charsError)!.message);
  if (!me) return null;
  return {
    userId: user.id,
    email: user.email ?? null,
    role: me.role,
    displayName: me.display_name ?? "",
    characterIds: (chars ?? []).map((c) => c.character_id),
  };
}

/** 저장 후 정적 페이지를 다시 만들도록 서버에 알린다. */
export async function revalidateSite(sb: SupabaseClient) {
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

/** Supabase 오류를 관리자에게 보여 줄 문장으로 */
export function describeError(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) return "이 작업을 할 권한이 없습니다.";
  if (error.code === "23505") return "이미 있는 값입니다.";
  return error.message;
}
