import { notFound } from "next/navigation";
import { getAuthorNames, getCommonGuides, getLatestPatchId } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CommonGuideCard } from "@/components/common-guide-card";
import { CommonGuideList } from "@/components/common-guide-list";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

export const revalidate = 3600;

/** 공통 공략 · 시스템 글: 드라이브 시스템 · 공격 · 수비처럼 모든 캐릭터에 통용되는 글 */
export default async function GuidePage({ params }: PageProps<"/[lang]/guide">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [guides, latestPatchId, authors] = await Promise.all([getCommonGuides(), getLatestPatchId(), getAuthorNames()]);

  // 관리자 버튼: 목록 위와 아래에 같은 것을 둔다 (최고/부 관리자에게만 보인다)
  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <ReorderButton table="common_guides" characterId={null} label="시스템 글" />
      <AddButton entity="guide" label="시스템 글 추가" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="common_guides" entity="guide" characterId={null} label="시스템 글" />
      <CommonGuideList
        dict={dict}
        items={guides
          .filter((g) => g.is_published)
          .map((guide) => ({
            id: guide.id,
            topic: guide.topic,
            level: guide.target_level,
            card: (
              <CommonGuideCard guide={guide} locale={lang} dict={dict} latestPatchId={latestPatchId} authors={authors} />
            ),
          }))}
      />
      {adminActions}
    </div>
  );
}
