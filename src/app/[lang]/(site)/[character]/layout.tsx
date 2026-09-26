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
        className={`relative -mx-4 overflow-hidden border-y border-border bg-surface px-4 sm:mx-0 sm:border-x ${banner ? "h-44 sm:h-auto sm:aspect-[100/21.2]" : "stripes"}`}
      >
        {banner ? (
          // 공식 캐릭터 페이지 첫 화면에서 맨 위 메뉴를 뺀 구간을 그대로 옮긴다 (배치는 roster.ts 의 rosterBanner).
          // 무대(stage)의 폭을 기준(cqw)으로 배경·캐릭터를 놓아, 화면 폭이 달라도 같은 구도가 된다.
          // 좁은 화면에서는 무대를 52rem 로 두고 가운데를 보여 준다.
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-1/2 w-[max(100%,52rem)] -translate-x-1/2 overflow-hidden [container-type:inline-size]"
            >
              {[banner.background, banner.figure].map((layer) => (
                // eslint-disable-next-line @next/next/no-img-element -- 잘라 둔 정적 이미지(없으면 공식 원본)
                <img
                  key={layer.src}
                  alt=""
                  src={layer.src}
                  className="absolute max-w-none object-contain"
                  style={{
                    left: `${layer.left}cqw`,
                    top: `${layer.top}cqw`,
                    width: `${layer.width}cqw`,
                    height: layer.height === undefined ? undefined : `${layer.height}cqw`,
                  }}
                />
              ))}
            </div>
            {/* 이름·버튼이 잘 보이도록 왼쪽 아래만 살짝 어둡게 */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--bg-deep) 70%, transparent) 0%, transparent 45%), linear-gradient(0deg, color-mix(in srgb, var(--bg-deep) 50%, transparent), transparent 40%)",
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
          className={`relative flex flex-wrap items-end justify-between gap-4 sm:px-4 ${banner ? "h-full py-5" : "py-7"}`}
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
