import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { SitePrefs } from "@/components/prefs-controls";
import { AdminProvider } from "@/components/admin/admin-context";
import { ChangelogButton } from "@/components/changelog";
import { CHANGELOG } from "@/content/changelog";

/** 일반 페이지: 헤더 · 푸터 · 관리자 도구 */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
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
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-muted transition-colors hover:text-accent">
      {children}
    </Link>
  );
}
