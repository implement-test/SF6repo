import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHeader } from "@/components/headings";
import { FavoritesHome } from "@/components/favorites-home";

/** 개인 홈: 즐겨찾기 모아 보기. 즐겨찾기는 브라우저에만 있으므로 내용은 브라우저에서 불러온다 */
export default async function FavoritesPage({ params }: PageProps<"/[lang]/favorites">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Favorites" title={dict.favoritesPage.title}>
        {dict.favoritesPage.intro}
      </PageHeader>
      <FavoritesHome locale={lang} dict={dict} />
    </div>
  );
}
