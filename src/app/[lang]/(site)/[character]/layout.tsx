import { notFound } from "next/navigation";
import { getCharacter, getCharacters, getPatches } from "@/lib/data";
import { LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { ContentFilters } from "@/components/prefs-controls";
import { CharacterNav } from "@/components/character-nav";
import { formatPatchVersion } from "@/lib/patch";
import { PresetButton } from "@/components/admin/preset-button";
import { HashHighlight } from "@/components/hash-highlight";
import { VsOpponentPicker } from "@/components/vs-opponent-picker";
import { rosterBanner } from "@/lib/roster";

export async function generateStaticParams() {
  const characters = await getCharacters();
  return LOCALES.flatMap((lang) => characters.map((c) => ({ lang, character: c.slug })));
}

export default async function CharacterLayout({ children, params }: LayoutProps<"/[lang]/[character]">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const [character, patches] = await Promise.all([getCharacter(slug), getPatches()]);
  if (!character) notFound();
  const dict = getDictionary(lang);
  const name = pickLocalized(character.name, lang).text;
  const latest = patches[0];
  const banner = rosterBanner(slug);

  return (
    <div className="flex flex-col gap-5">
      <section
        className={`relative -mx-4 overflow-hidden border-y border-border bg-surface px-4 sm:mx-0 sm:border-x ${banner ? "" : "stripes"}`}
      >
        {banner ? (
          // 공식 사이트 캐릭터 페이지 상단처럼: 배경 그림 + 오른쪽에 캐릭터 (상반신만 보이게 잘림). 글자는 우리 것
          <>
            <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner.background})` }} />
            {/* 캐릭터: 오른쪽 칸을 채우고 캐릭터마다 정한 높이(figureY)를 보여 준다. 왼쪽 가장자리는 흐리게 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-[70%] sm:right-[4%] sm:w-[50%]"
              style={{ maskImage: "linear-gradient(90deg, transparent, black 22%)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 공식 사이트 이미지를 그대로 불러온다 */}
              <img
                alt=""
                src={banner.figure}
                className="h-full w-full object-cover"
                style={{ objectPosition: `50% ${banner.figureY}%` }}
              />
            </div>
            {/* 이름·버튼이 잘 보이도록 왼쪽과 아래를 어둡게 */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--bg-deep) 88%, transparent) 0%, color-mix(in srgb, var(--bg-deep) 45%, transparent) 38%, transparent 65%), linear-gradient(0deg, color-mix(in srgb, var(--bg-deep) 55%, transparent), transparent 45%)",
              }}
            />
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-2/3"
              style={{ background: "linear-gradient(100deg, transparent 20%, color-mix(in srgb, var(--accent) 22%, transparent))" }}
            />
            {character.portrait_url && (
              <div
                aria-hidden
                className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-right-top opacity-80"
                style={{
                  backgroundImage: `url(${character.portrait_url})`,
                  maskImage: "linear-gradient(90deg, transparent, black 40%)",
                }}
              />
            )}
          </>
        )}
        <div
          className={`relative flex flex-wrap items-end justify-between gap-4 sm:px-4 ${banner ? "min-h-44 py-6 sm:min-h-56" : "py-7"}`}
        >
          <div>
            <p className="eyebrow">Character</p>
            <h1 className="display mt-1 text-5xl uppercase sm:text-6xl">{name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 관리자 도구: 이 캐릭터를 편집할 수 있는 관리자에게만 보인다 */}
            <PresetButton characterId={character.id} characterName={pickLocalized(character.name, "ko").text} />
            {latest && (
              <div className="skew bg-highlight px-3 py-1 text-highlight-fg">
                <span className="display text-sm not-italic">{formatPatchVersion(latest.version)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-border bg-bg/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <CharacterNav slug={slug} labels={dict.nav} />
      </div>

      {/* Vs 탭에서만 보이는 상대 캐릭터 선택 (필터 바 위) */}
      <VsOpponentPicker dict={dict} locale={lang} />
      <ContentFilters dict={dict} />

      <div>{children}</div>
      <HashHighlight />
    </div>
  );
}
