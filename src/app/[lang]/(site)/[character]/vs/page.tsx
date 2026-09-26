import { notFound } from "next/navigation";
import { getAuthorNames, getCharacter, getCharacters, getLatestPatchId, getVsGuides } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { VsGuideCard } from "@/components/vs-guide-card";
import { VsGuideList } from "@/components/vs-guide-list";
import { DraftItems } from "@/components/admin/drafts";

export const revalidate = 3600;

/** Vs 가이드. 상대 선택 칸은 캐릭터 레이아웃(필터 바 위)에 있다 */
export default async function VsPage({ params }: PageProps<"/[lang]/[character]/vs">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [guides, characters, latestPatchId, authors] = await Promise.all([
    getVsGuides(character.id),
    getCharacters(),
    getLatestPatchId(),
    getAuthorNames(),
  ]);
  // 상대도 사이트에 페이지가 있으면 그 캐릭터 관리자도 편집할 수 있다
  const characterIdBySlug = new Map(characters.map((c) => [c.slug, c.id]));

  return (
    <div className="flex flex-col gap-4">
      <DraftItems table="vs_guides" entity="vs" characterId={character.id} label="Vs 가이드" />
      <VsGuideList
        dict={dict}
        characterId={character.id}
        characterName={character.name.ko}
        items={guides
          .filter((g) => g.is_published)
          .map((guide) => ({
            id: guide.id,
            opponent: guide.opponent,
            topic: guide.topic,
            level: guide.target_level,
            card: (
              <VsGuideCard
                guide={guide}
                locale={lang}
                dict={dict}
                latestPatchId={latestPatchId}
                authors={authors}
                opponentCharacterId={characterIdBySlug.get(guide.opponent)}
              />
            ),
          }))}
      />
    </div>
  );
}
