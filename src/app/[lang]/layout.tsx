import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Barlow_Condensed, Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PREFS_INLINE_SCRIPT } from "@/lib/prefs";
import { SitePrefs } from "@/components/prefs-controls";
import { AdminProvider } from "@/components/admin/admin-context";
import { ChangelogButton } from "@/components/changelog";
import { CHANGELOG } from "@/content/changelog";
import { pickLocalized } from "@/lib/i18n/localized";
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

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

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
      <body className="flex min-h-full flex-col font-sans">
        <AdminProvider>
        <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
          <div className="brand-bar h-[3px]" />
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2.5">
            <Link href="/" className="group flex items-center gap-2 whitespace-nowrap" aria-label={dict.siteName}>
              <span className="skew bg-accent px-2 py-0.5 text-accent-fg">
                <span className="display text-xl">SF6</span>
              </span>
              <span className="display text-xl uppercase tracking-wide group-hover:text-accent">Repository</span>
            </Link>
            <nav className="order-last flex w-full gap-5 whitespace-nowrap sm:order-none sm:w-auto">
              <HeaderLink href="/notation">{dict.nav.notation}</HeaderLink>
              <HeaderLink href="/glossary">{dict.nav.glossary}</HeaderLink>
              <ChangelogButton
                labels={dict.changelog}
                entries={CHANGELOG.map((entry) => ({
                  date: entry.date,
                  items: entry.items.map((item) => ({
                    kind: item.kind,
                    text: pickLocalized(item.text, lang).text,
                    adminOnly: !!item.adminOnly,
                  })),
                }))}
              />
            </nav>
            <div className="ml-auto">
              <SitePrefs locale={lang} dict={dict} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>

        <footer className="border-t border-border bg-bg-deep">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="display text-base not-italic text-fg">
              SF6 <span className="text-accent">REPOSITORY</span>
            </span>
            <p>{dict.footer.disclaimer}</p>
          </div>
        </footer>
        </AdminProvider>
      </body>
    </html>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-muted transition-colors hover:text-accent">
      {children}
    </Link>
  );
}
