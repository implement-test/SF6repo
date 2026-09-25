import { parseYouTube, youTubeEmbedUrl } from "@/lib/youtube";
import { MediaToggle } from "./media-toggle";

/**
 * 항목에 붙은 영상. 버튼으로 펼치기/접기 (기본은 접힘), 가운데 정렬.
 *   YouTube 링크 → 플레이어 임베드 (youtube_start 가 있으면 그 값, 없으면 링크의 t= 사용)
 *   media_url   → R2 의 짧은 영상 (움짤처럼 자동 반복 재생)
 */
export function ItemMedia({
  youtubeUrl,
  youtubeStart,
  mediaUrl,
  title,
  showLabel,
  hideLabel,
}: {
  youtubeUrl: string | null;
  youtubeStart: number | null;
  mediaUrl: string | null;
  title: string;
  showLabel: string;
  hideLabel: string;
}) {
  const yt = parseYouTube(youtubeUrl);
  if (!yt && !mediaUrl) return null;

  return (
    <MediaToggle showLabel={showLabel} hideLabel={hideLabel}>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3">
        {mediaUrl && (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="aspect-video w-full border border-border bg-black object-contain"
          />
        )}
        {yt && (
          <iframe
            src={youTubeEmbedUrl(yt.id, youtubeStart ?? yt.start)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full border border-border bg-black"
          />
        )}
      </div>
    </MediaToggle>
  );
}
