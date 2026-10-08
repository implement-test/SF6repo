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

/**
 * 저장 후 정적 페이지를 다시 만들도록 서버에 알린다.
 * 서버(Route Handler)는 무효화 기록을 응답을 보낸 직후에 남기므로, 바로 이어지는 router.refresh() 가
 * 예전 페이지를 받지 않도록 잠깐 기다린다. 실패해도 저장은 끝난 것이라 예외를 던지지 않는다
 * (Server Action 으로 바꿔 봤지만 Cloudflare 에서 저장이 멈춰서 되돌렸다).
 */
export async function revalidateSite(sb: SupabaseClient) {
  try {
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) console.error("revalidate failed:", res.status);
    scheduleSecondRevalidate(token);
    await new Promise((resolve) => setTimeout(resolve, 1200));
  } catch (e) {
    console.error("revalidate failed:", e);
  }
}

let secondPass: ReturnType<typeof setTimeout> | null = null;

/**
 * 20초 뒤에 한 번 더 무효화한다. 페이지를 새로 만드는 데 길게는 15초쯤 걸려서,
 * 저장 전에 만들기 시작한 페이지가 무효화보다 늦게 완성되면 예전 내용이 최신으로 남는다 (콤보 추가 직후 그룹 지정 등).
 * 연달아 저장하면 마지막 저장 기준으로 한 번만 보낸다.
 */
function scheduleSecondRevalidate(token: string) {
  if (secondPass) clearTimeout(secondPass);
  secondPass = setTimeout(() => {
    secondPass = null;
    fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }, 20_000);
}

/** Supabase 오류를 관리자에게 보여 줄 문장으로 */
export function describeError(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security/i.test(error.message)) return "이 작업을 할 권한이 없습니다.";
  if (error.code === "23505") return "이미 있는 값입니다.";
  if (error.code === "PGRST205" || error.code === "42P01" || error.code === "42703")
    return "DB 구조가 최신이 아닙니다. supabase/migrations 의 SQL 을 실행했는지 확인하세요.";
  return error.message;
}
