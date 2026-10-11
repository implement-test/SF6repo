// Cloudflare Worker 진입점. OpenNext 가 만든 워커(.open-next/worker.js)를 그대로 쓰고,
// Cron 으로 하루 한 번 /api/ping 을 불러 Supabase 무료 프로젝트가 일시정지되지 않게 한다 (wrangler.jsonc 의 triggers).
// 페이지는 관리자가 저장할 때만 다시 만들기 때문에(revalidate = false), 방문만으로는 DB 요청이 생기지 않는다.
import handler from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,

  async scheduled(controller, env, ctx) {
    const res = await handler.fetch(new Request("https://sf6.nogamenogain.com/api/ping"), env, ctx);
    if (!res.ok) console.error("supabase ping failed:", res.status, await res.text());
  },
};
