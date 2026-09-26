import { notFound } from "next/navigation";
import { getCharacter, getLatestPatchId, getVideos } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { VideoCard } from "@/components/video-card";
import { VideoList } from "@/components/video-list";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

export const revalidate = 3600;

/** 추천 영상: 캐릭터별 YouTube 영상 모음 (썸네일을 누르면 그 자리에서 재생) */
export default async function VideosPage({ params }: PageProps<"/[lang]/[character]/videos">) {
  const { lang, character: slug } = await params;
  if (!hasLocale(lang)) notFound();
  const character = await getCharacter(slug);
  if (!character) notFound();

  const dict = getDictionary(lang);
  const [videos, latestPatchId] = await Promise.all([getVideos(character.id), getLatestPatchId()]);

  // 관리자 버튼: 목록 위와 아래에 같은 것을 둔다
  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <ReorderButton table="videos" characterId={character.id} label="추천 영상" />
      <AddButton entity="video" label="영상 추가" scope={character.id} defaults={{ character_id: character.id }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="videos" entity="video" characterId={character.id} label="추천 영상" />
      <VideoList
        dict={dict}
        characterId={character.id}
        items={videos
          .filter((v) => v.is_published)
          .map((video) => ({
            id: video.id,
            level: video.target_level,
            language: video.language,
            card: <VideoCard video={video} locale={lang} dict={dict} latestPatchId={latestPatchId} />,
          }))}
      />
      {adminActions}
    </div>
  );
}
