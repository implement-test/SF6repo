import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { LOCALES } from "@/lib/i18n/config";

/** 캐릭터 한 명의 페이지 (캐릭터 탭과 같은 목록, "" 는 개요) */
const CHARACTER_PAGES = ["", "/favorites", "/moves", "/combos", "/setups", "/tips", "/practice", "/vs", "/videos"];
/** 공통 공략 페이지 */
const GUIDE_PAGES = ["/guide", "/guide/practice", "/guide/videos"];

/**
 * 관리자가 콘텐츠를 저장한 뒤 호출한다. 요청자의 토큰으로 admins 테이블을 조회해 관리자인지 확인한다 (RLS: 자기 행만 보임).
 *   { characters: [3, null] } → 그 캐릭터들의 페이지만 (null 은 공통 공략), 퍼가기(embed) 페이지 포함
 *   { all: true } 또는 본문 없음 → 사이트 전체
 * 범위를 좁히면 저장 뒤 다시 만드는 페이지가 줄어 CPU · R2 쓰기를 아낀다.
 * 경로는 rewrite 된 실제 경로(/ko/terry/combos)로 넘긴다. 페이지마다 그 경로가 캐시 태그로 붙는다.
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

  const body = (await request.json().catch(() => null)) as { all?: boolean; characters?: unknown[] } | null;
  const ids = Array.isArray(body?.characters) ? body.characters : null;
  if (!ids || body?.all) {
    // 루트 레이아웃 아래 전부
    revalidatePath("/[lang]", "layout");
    return Response.json({ ok: true, scope: "all" });
  }

  const numbers = ids.filter((id): id is number => typeof id === "number");
  const { data: rows } = numbers.length
    ? await sb.from("characters").select("slug").in("id", numbers)
    : { data: [] as { slug: string }[] };
  const bases = [
    ...(rows ?? []).flatMap((r) => CHARACTER_PAGES.map((p) => `/${r.slug}${p}`)),
    ...(ids.includes(null) ? GUIDE_PAGES : []),
  ];
  for (const lang of LOCALES) for (const path of bases) revalidatePath(`/${lang}${path}`);
  // 퍼가기 페이지는 콤보 · 셋업 id 로만 열리므로 전부 (방문할 때만 다시 만든다)
  if (numbers.length) {
    revalidatePath("/[lang]/embed/combo/[id]", "page");
    revalidatePath("/[lang]/embed/setup/[id]", "page");
  }
  return Response.json({ ok: true, scope: bases.length });
}
