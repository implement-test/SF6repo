import { notFound } from "next/navigation";
import { getCharacter, getLatestPatchId, getMoves } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOVE_CATEGORIES } from "@/lib/types";
import { MoveCard } from "@/components/move-card";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";
import { MoveImportButton } from "@/components/admin/move-import-button";
import { pickLocalized } from "@/lib/i18n/localized";

export const revalidate = 3600;

/**
 * 커맨드 리스트: 분류(기본기 → 특수기 → 타겟 콤보 → 잡기 → 드라이브 → 필살기 → 슈퍼 아츠)별 기술 카드.
 * 맨 위에 분류 바로가기. 대상 수준 필터는 쓰지 않는다 (모든 기술을 보여 준다).
 */
export default async function MovesPage({ params }: PageProps<"/[lang]/[character]/moves">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [moves, latestPatchId] = await Promise.all([getMoves(character.id), getLatestPatchId()]);
  const published = moves.filter((m) => m.is_published);
  const groups = MOVE_CATEGORIES.map((category) => ({
    category,
    moves: published.filter((m) => m.category === category),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-2 empty:hidden">
        <MoveImportButton characterId={character.id} characterName={pickLocalized(character.name, "ko").text} />
        <ReorderButton table="moves" characterId={character.id} label="커맨드" />
        <AddButton entity="move" label="커맨드 추가" scope={character.id} defaults={{ character_id: character.id }} />
      </div>
      <DraftItems table="moves" entity="move" characterId={character.id} label="커맨드" />

      {published.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-muted">{dict.moves.empty}</p>
      ) : (
        <>
          {/* 분류 바로가기 */}
          <nav className="flex flex-wrap gap-1.5">
            {groups
              .filter((g) => g.moves.length > 0)
              .map((g) => (
                <a
                  key={g.category}
                  href={`#moves-${g.category}`}
                  className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:border-accent hover:text-fg"
                >
                  <span>
                    {dict.moves.categories[g.category]} <span className="text-xs opacity-70">{g.moves.length}</span>
                  </span>
                </a>
              ))}
          </nav>

          {groups
            .filter((g) => g.moves.length > 0)
            .map((g) => (
              <section key={g.category} id={`moves-${g.category}`} className="flex scroll-mt-32 flex-col gap-2">
                <h2 className="flex items-center gap-2 border-b border-border pb-1.5">
                  <span aria-hidden className="skew inline-block h-4 w-1.5 bg-accent" />
                  <span className="display text-xl">{dict.moves.categories[g.category]}</span>
                  <span className="ml-auto">
                    <AddButton
                      entity="move"
                      label={`${dict.moves.categories[g.category]} 추가`}
                      scope={character.id}
                      defaults={{ character_id: character.id, category: g.category }}
                    />
                  </span>
                </h2>
                {g.moves.map((move) => (
                  <MoveCard key={move.id} move={move} locale={lang} dict={dict} latestPatchId={latestPatchId} />
                ))}
              </section>
            ))}
          {/* 커맨드 표 일부를 가져온 곳 (scripts/import-ufd.mjs) */}
          <p className="text-right text-xs text-muted">
            {dict.moves.source}{" "}
            <a href="https://ultimateframedata.com/sf6/" target="_blank" rel="noreferrer" className="underline hover:text-fg">
              Ultimate Frame Data
            </a>
          </p>
        </>
      )}
    </div>
  );
}
