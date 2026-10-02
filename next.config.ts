import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 언어 코드가 붙지 않는 경로만 대상으로 한다 (정적 파일, 아이콘, 이미 /ko 등이 붙은 내부 경로 제외).
// 첫 단계(first)와 나머지 단계(rest, 여러 개)를 나눠 받는다. Cloudflare(OpenNext) 라우터는 재작성 결과의
// 각 칸에 '/' 가 든 값을 허용하지 않아서, 여러 단계를 한 칸에 담으면 500 오류가 난다.
// 점(.)이 든 단계는 정적 파일이라 제외한다.
const PAGE_PATH = "/:first((?!(?:_next|api|icons|media|characters|ko|en|ja)(?![^/]))[^/.]+)/:rest([^/.]+)*";
const PAGE_DEST = ":first/:rest*";

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
   * has 의 정규식은 ^ 로 시작을 고정한다. OpenNext 는 조건을 부분 일치로 검사하고 lang 값은 전체 일치로 꺼내서,
   * 고정하지 않으면 "ko-KR,ko;q=0.9,en-US" 같은 한국어 브라우저 헤더가 조건만 통과하고 lang 이 비어 404/500 이 난다.
   */
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "cookie", key: "lang", value: "^(?<lang>ko|en|ja)$" }], destination: "/:lang" },
        { source: PAGE_PATH, has: [{ type: "cookie", key: "lang", value: "^(?<lang>ko|en|ja)$" }], destination: `/:lang/${PAGE_DEST}` },
        { source: "/", has: [{ type: "header", key: "accept-language", value: "^(?<lang>ja|en).*" }], destination: "/:lang" },
        { source: PAGE_PATH, has: [{ type: "header", key: "accept-language", value: "^(?<lang>ja|en).*" }], destination: `/:lang/${PAGE_DEST}` },
        { source: "/", destination: "/ko" },
        { source: PAGE_PATH, destination: `/ko/${PAGE_DEST}` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

// `next dev` 에서도 Cloudflare 바인딩(R2 등)을 쓸 수 있게 한다.
initOpenNextCloudflareForDev();
