import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Barlow_Condensed, Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { LOCALES, hasLocale } from "@/lib/i18n/config";
import { PREFS_INLINE_SCRIPT } from "@/lib/prefs";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// 헤드라인용: SF6 UI 처럼 굵은 컨덴스드 이탤릭
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});
// 헤드라인의 한글용. 글자 범위별로 나눠 받으므로 미리 받지 않는다.
const notoKr = Noto_Sans_KR({ variable: "--font-noto-kr", weight: ["700", "900"], preload: false });

export const metadata: Metadata = {
  title: { default: "SF6 Repository", template: "%s · SF6 Repository" },
  description: "Street Fighter 6 character guides, combos, setups and practice settings.",
};

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * 모든 페이지 공통 뼈대 (html · 글꼴 · 방문자 설정).
 * 헤더·푸터·관리자 도구는 일반 페이지 묶음 (site)/layout.tsx 에 있고,
 * 다른 사이트에 퍼가는 embed 페이지는 그것들 없이 이 뼈대만 쓴다.
 */
export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} ${notoKr.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_INLINE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
