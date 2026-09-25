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

/** 현재 로그인한 계정이 admins 테이블에 있는지 (RLS 로 자기 행만 보인다) */
export async function checkIsAdmin(sb: SupabaseClient): Promise<boolean> {
  const { data: session } = await sb.auth.getSession();
  if (!session.session) return false;
  const { data } = await sb.from("admins").select("user_id").maybeSingle();
  return !!data;
}

/** 저장 후 정적 페이지를 다시 만들도록 서버에 알린다. */
export async function revalidateSite(sb: SupabaseClient) {
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
