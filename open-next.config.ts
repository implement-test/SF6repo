import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

export default defineCloudflareConfig({
  // ISR 캐시를 R2 에 저장하고, 앞에 데이터센터별 Cloudflare 캐시(Cache API)를 둔다 (regional cache).
  // 같은 지역의 반복 방문은 R2 를 읽지 않는다. (버킷은 배포 전에 한 번 만들어 둬야 함 — docs/SETUP.md)
  //   - shouldLazilyUpdateOnCacheHit: false — 캐시에 있으면 R2 를 다시 읽지 않는다 (켜 두면 방문마다 뒤에서 R2 를 읽어 절약이 거의 없다)
  //   - 관리자 저장 반영은 그대로: 캐시에 있어도 D1 태그 캐시로 무효화됐는지 확인하고, 무효화됐으면 다시 만든다
  //   - 캐시는 하루 보관 (페이지는 저장할 때만 바뀌므로 길어도 된다. 지나면 R2 에서 다시 읽는다)
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    shouldLazilyUpdateOnCacheHit: false,
    bypassTagCacheOnCacheHit: false,
    defaultLongLivedTtlSec: 24 * 60 * 60,
  }),
  // 관리자가 저장할 때의 revalidatePath 를 기록한다 (D1, 없으면 저장해도 사이트에 반영되지 않는다)
  tagCache: d1NextTagCache,
  // 재검증 요청 (자기 자신 서비스 바인딩으로 보낸다). 페이지는 revalidate = false 라 저장 뒤에만 쓰인다
  queue: memoryQueue,
});
