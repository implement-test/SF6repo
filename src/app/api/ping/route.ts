import { getPatches } from "@/lib/data";

/**
 * Supabase 일시정지 방지용 핑. 무료 프로젝트는 7일간 요청이 없으면 멈추므로
 * Cloudflare Cron(하루 한 번, worker.mjs 의 scheduled)이 이 주소를 부른다.
 * 페이지는 저장할 때만 다시 만들어서, 이 핑이 없으면 방문만으로는 DB 요청이 생기지 않는다.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const patches = await getPatches();
    return Response.json({ ok: true, patches: patches.length });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
