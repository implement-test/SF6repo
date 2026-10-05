"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/**
 * 관리자가 콘텐츠를 저장한 뒤 호출한다. 모든 언어의 정적 페이지를 다시 만들게 한다.
 * 요청자의 토큰으로 admins 테이블을 조회해 관리자인지 확인한다 (RLS: 자기 행만 보임).
 *
 * Route Handler 가 아니라 Server Action 인 이유: Route Handler 는 revalidatePath 를 응답을 보낸 뒤에 처리해서,
 * 바로 이어지는 router.refresh() 가 무효화 전의 캐시를 받는 경우가 있었다. Server Action 은 무효화를 끝내고 응답한다.
 */
export async function revalidateSiteAction(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) return { ok: false, error: "unauthorized" };

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: user } = await sb.auth.getUser(token);
  if (!user.user) return { ok: false, error: "unauthorized" };
  // 최고/부 관리자는 모든 관리자 행을 볼 수 있으므로 자기 행으로 좁힌다.
  const { data, error } = await sb.from("admins").select("user_id").eq("user_id", user.user.id).maybeSingle();
  if (error || !data) return { ok: false, error: "forbidden" };

  // rewrite 된 실제 경로(/[lang]/...) 기준으로, 루트 레이아웃 아래 전부를 무효화한다.
  revalidatePath("/[lang]", "layout");
  return { ok: true };
}
