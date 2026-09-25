import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/**
 * 관리자가 콘텐츠를 저장한 뒤 호출한다. 모든 언어의 정적 페이지를 다시 만들게 한다.
 * 요청자의 토큰으로 admins 테이블을 조회해 관리자인지 확인한다 (RLS: 자기 행만 보임).
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: user } = await sb.auth.getUser(token);
  if (!user.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  // 최고/부 관리자는 모든 관리자 행을 볼 수 있으므로 자기 행으로 좁힌다.
  const { data, error } = await sb.from("admins").select("user_id").eq("user_id", user.user.id).maybeSingle();
  if (error || !data) return Response.json({ error: "forbidden" }, { status: 403 });

  // rewrite 된 실제 경로(/[lang]/...) 기준으로, 루트 레이아웃 아래 전부를 무효화한다.
  revalidatePath("/[lang]", "layout");
  return Response.json({ ok: true });
}
