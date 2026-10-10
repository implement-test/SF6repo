import { notFound } from "next/navigation";
import { getLatestPatchId, getVideos } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { VideoCard } from "@/components/video-card";
import { VideoList } from "@/components/video-list";
import { AddButton } from "@/components/admin/admin-context";
import { DraftItems } from "@/components/admin/drafts";
import { ReorderButton } from "@/components/admin/reorder-button";

export const revalidate = 3600;

/** 공통 공략 · 추천 영상: 캐릭터와 상관없는 강의 영상 (videos 에서 character_id 가 비어 있는 행) */
export default async function GuideVideosPage({ params }: PageProps<"/[lang]/guide/videos">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [videos, latestPatchId] = await Promise.all([getVideos(null), getLatestPatchId()]);

  const adminActions = (
    <div className="flex justify-end gap-2 empty:hidden">
      <ReorderButton table="videos" characterId={null} label="공통 추천 영상" />
      <AddButton entity="video" label="공통 영상 추가" defaults={{ character_id: null }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {adminActions}
      <DraftItems table="videos" entity="video" characterId={null} label="공통 추천 영상" />
      <VideoList
        dict={dict}
        characterId={null}
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
