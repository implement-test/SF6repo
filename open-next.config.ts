import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

export default defineCloudflareConfig({
  // ISR 캐시를 R2 에 저장한다. (버킷은 배포 전에 한 번 만들어 둬야 함 — docs/SETUP.md)
  incrementalCache: r2IncrementalCache,
  // 관리자가 저장할 때의 revalidatePath 를 기록한다 (D1, 없으면 저장해도 사이트에 반영되지 않는다)
  tagCache: d1NextTagCache,
  // 1시간마다 페이지를 새로 만드는 재검증 요청 (자기 자신 서비스 바인딩으로 보낸다)
  queue: memoryQueue,
});
