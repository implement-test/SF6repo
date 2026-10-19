import { notFound } from "next/navigation";
import { getAuthorNames, getCharacter, getLatestPatchId, getMoves, getTips } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TIP_TOPICS } from "@/lib/types";
import { SetupCard } from "@/components/setup-card";
import { SetupFilters } from "@/components/setup-filters";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

// 시간이 지나도 다시 만들지 않는다. 관리자가 저장할 때만 /api/revalidate 로 갱신 (CPU · R2 절약)
export const revalidate = false;

/** 플레이 팁: 히트 확인 · 주요 기본기 · 공통 대처 · 운영. 셋업과 같은 구조에 주제와 커맨드 리스트 기술 연결 */
export default async function TipsPage({ params }: PageProps<"/[lang]/[character]/tips">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [tips, moves, latestPatchId, authors] = await Promise.all([
    getTips(character.id),
    getMoves(character.id),
    getLatestPatchId(),
    getAuthorNames(),
  ]);
  const published = tips.filter((t) => t.is_published);
  // 공개된 기술만 카드에 보여 준다
  const publicMoves = moves.filter((m) => m.is_published);
  // 쓰인 주제만 필터에
  const topics = TIP_TOPICS.filter((t) => published.some((p) => p.topic === t)).map((t) => ({ slug: t, name: dict.tips.topics[t] }));

  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <ReorderButton table="tips" characterId={character.id} label="플레이 팁" />
      <AddButton entity="tip" label="플레이 팁 추가" scope={character.id} defaults={{ character_id: character.id }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="tips" entity="tip" characterId={character.id} label="플레이 팁" />
      <SetupFilters
        kind="tip"
        dict={dict}
        characterId={character.id}
        situations={topics.length > 1 ? topics : []}
        items={published.map((tip) => ({
          id: tip.id,
          level: tip.target_level,
          situations: [tip.topic],
          card: (
            <SetupCard
              kind="tip"
              setup={tip}
              locale={lang}
              dict={dict}
              situationNames={{}}
              linkedEnders={[]}
              latestPatchId={latestPatchId}
              authors={authors}
              characterSlug={slug}
              moves={publicMoves}
            />
          ),
        }))}
      />
      {adminActions}
    </div>
  );
}
