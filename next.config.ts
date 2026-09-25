import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 언어 코드가 붙지 않는 경로만 대상으로 한다 (정적 파일, 아이콘, 이미 /ko 등이 붙은 내부 경로 제외).
const PAGE_PATH = "/:path((?!_next|api|icons|media|ko(?:/|$)|en(?:/|$)|ja(?:/|$))[^.]*)";

const nextConfig: NextConfig = {
  images: {
    // 이미지 최적화는 Cloudflare Images(유료 구간 있음)가 필요하므로 끈다.
    unoptimized: true,
  },

  /**
   * URL 에는 언어를 넣지 않는다 (/terry/combos).
   * 쿠키(lang) → 브라우저 언어 → 한국어 순으로 언어를 정해 내부 경로 /{lang}/... 로 rewrite 한다.
   * 페이지는 언어별로 정적 생성되므로 방문자 요청이 DB 를 직접 부르지 않는다.
   * (proxy.ts 는 Cloudflare 에서 실험 기능이라 설정 파일의 rewrite 로 처리)
   */
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "cookie", key: "lang", value: "(?<lang>ko|en|ja)" }], destination: "/:lang" },
        { source: PAGE_PATH, has: [{ type: "cookie", key: "lang", value: "(?<lang>ko|en|ja)" }], destination: "/:lang/:path" },
        { source: "/", has: [{ type: "header", key: "accept-language", value: "(?<lang>ja|en).*" }], destination: "/:lang" },
        { source: PAGE_PATH, has: [{ type: "header", key: "accept-language", value: "(?<lang>ja|en).*" }], destination: "/:lang/:path" },
        { source: "/", destination: "/ko" },
        { source: PAGE_PATH, destination: "/ko/:path" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

// `next dev` 에서도 Cloudflare 바인딩(R2 등)을 쓸 수 있게 한다.
initOpenNextCloudflareForDev();
