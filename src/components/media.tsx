import { parseYouTube, youTubeEmbedUrl } from "@/lib/youtube";

/**
 * 항목에 붙은 영상.
 *   YouTube 링크 → 플레이어 임베드 (youtube_start 가 있으면 그 값, 없으면 링크의 t= 사용)
 *   media_url   → R2 의 짧은 영상 (움짤처럼 자동 반복 재생)
 */
export function ItemMedia({
  youtubeUrl,
  youtubeStart,
  mediaUrl,
  title,
}: {
  youtubeUrl: string | null;
  youtubeStart: number | null;
  mediaUrl: string | null;
  title: string;
}) {
  const yt = parseYouTube(youtubeUrl);
  if (!yt && !mediaUrl) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
        <div className={mediaUrl ? "" : "sm:col-span-2"}>
          <iframe
            src={youTubeEmbedUrl(yt.id, youtubeStart ?? yt.start)}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full max-w-3xl border border-border bg-black"
          />
        </div>
      )}
    </div>
  );
}
