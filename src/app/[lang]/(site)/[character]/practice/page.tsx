import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthorNames, getCharacter, getLatestPatchId, getPractices } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SetupCard } from "@/components/setup-card";
import { SetupFilters } from "@/components/setup-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

// 시간이 지나도 다시 만들지 않는다. 관리자가 저장할 때만 /api/revalidate 로 갱신 (CPU · R2 절약)
export const revalidate = false;

/** 추천 연습: 셋업과 같은 구조 (이어지는 콤보 대신 상황을 글로) */
export default async function PracticePage({ params }: PageProps<"/[lang]/[character]/practice">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [practices, latestPatchId, authors] = await Promise.all([
    getPractices(character.id),
    getLatestPatchId(),
    getAuthorNames(),
  ]);

  // 관리자 버튼: 목록 위와 아래에 같은 것을 둔다 (방문자에게는 비어서 숨는다)
  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <ReorderButton table="practices" characterId={character.id} label="추천 연습" />
      <AddButton entity="practice" label="추천 연습 추가" scope={character.id} defaults={{ character_id: character.id }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      {/* 모든 캐릭터에 통용되는 것은 공통 공략에 */}
      <Link href="/guide/practice" className="self-end text-sm font-semibold text-muted transition-colors hover:text-accent">
        {dict.guide.seeCommon.practice} →
      </Link>
      <DraftItems table="practices" entity="practice" characterId={character.id} label="추천 연습" />
      <SetupFilters
        kind="practice"
        dict={dict}
        characterId={character.id}
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
                characterSlug={slug}
              />
            ),
          }))}
      />
      {adminActions}
    </div>
  );
}
