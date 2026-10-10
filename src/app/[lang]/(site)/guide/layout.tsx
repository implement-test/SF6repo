import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/headings";
import { GuideNav } from "@/components/guide-nav";
import { ContentFilters } from "@/components/prefs-controls";
import { HashHighlight } from "@/components/hash-highlight";

/**
 * 공통 공략: 특정 캐릭터가 아니라 모든 캐릭터에 통용되는 정보 (0028).
 * 탭은 시스템 글(/guide) · 추천 연습(/guide/practice) · 추천 영상(/guide/videos).
 * 필터 바(대상/표시/조작)는 캐릭터 페이지와 같은 규칙으로 시스템 글 · 추천 연습에서만 보인다.
 */
export default async function GuideLayout({ children, params }: LayoutProps<"/[lang]/guide">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="General guide" title={dict.guide.title}>
        {dict.guide.intro}
      </PageHeader>
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-border bg-bg/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <GuideNav labels={dict.guide.tabs} />
      </div>
      <ContentFilters dict={dict} />
      <div>{children}</div>
      <HashHighlight />
    </div>
  );
}
