import { notFound } from "next/navigation";
import { getAuthorNames, getLatestPatchId, getPractices } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SetupCard } from "@/components/setup-card";
import { SetupFilters } from "@/components/setup-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

// 시간이 지나도 다시 만들지 않는다. 관리자가 저장할 때만 /api/revalidate 로 갱신 (CPU · R2 절약)
export const revalidate = false;

/** 공통 공략 · 추천 연습: 캐릭터와 상관없는 연습 (practices 에서 character_id 가 비어 있는 행) */
export default async function GuidePracticePage({ params }: PageProps<"/[lang]/guide/practice">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [practices, latestPatchId, authors] = await Promise.all([getPractices(null), getLatestPatchId(), getAuthorNames()]);

  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <ReorderButton table="practices" characterId={null} label="공통 추천 연습" />
      <AddButton entity="practice" label="공통 추천 연습 추가" defaults={{ character_id: null }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="practices" entity="practice" characterId={null} label="공통 추천 연습" />
      <SetupFilters
        kind="practice"
        dict={dict}
        characterId={null}
        situations={[]}
        items={practices
          .filter((p) => p.is_published)
          .map((practice) => ({
            id: practice.id,
            level: practice.target_level,
            situations: [],
            card: (
              <SetupCard
                kind="practice"
                setup={practice}
                locale={lang}
                dict={dict}
                situationNames={{}}
                linkedEnders={[]}
                latestPatchId={latestPatchId}
                authors={authors}
                characterSlug=""
              />
            ),
          }))}
      />
      {adminActions}
    </div>
  );
}
