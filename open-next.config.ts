import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  // ISR 캐시를 R2 에 저장한다. (버킷은 배포 전에 한 번 만들어 둬야 함 — docs/SETUP.md)
  incrementalCache: r2IncrementalCache,
});
