import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { FavoritesHome } from "@/components/favorites-home";

/** 캐릭터 페이지의 즐겨찾기 탭: 이 캐릭터의 즐겨찾기만 (내용은 브라우저에서 불러온다) */
export default async function CharacterFavoritesPage({ params }: PageProps<"/[lang]/[character]/favorites">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();
  return <FavoritesHome locale={lang} dict={getDictionary(lang)} characterSlug={slug} />;
}
