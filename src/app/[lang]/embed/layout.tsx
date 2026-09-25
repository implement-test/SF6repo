import type { Metadata } from "next";

export const metadata: Metadata = {
  // 원본 페이지와 내용이 겹치므로 검색에는 원본만 나오게 한다.
  robots: { index: false, follow: true },
};

/** 다른 사이트에 퍼가는 화면: 헤더·푸터 없이 내용만 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl p-2 sm:p-3">{children}</main>;
}
