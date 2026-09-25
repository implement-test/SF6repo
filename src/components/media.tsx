import type { Dictionary } from "@/lib/i18n/dictionaries";
import { parseYouTube, youTubeEmbedUrl } from "@/lib/youtube";
import { MediaToggle } from "./media-toggle";
import { YouTubeLoop } from "./youtube-loop";

/**
 * 항목에 붙은 영상. 버튼으로 펼치기/접기 (기본은 접힘), 가운데 정렬.
 *   YouTube 링크 → 플레이어 임베드
 *     - 시작: youtube_start 가 있으면 그 값, 없으면 링크의 t=
 *     - 끝(youtube_end)만 있으면 그 구간을 재생하고 멈춘다
 *     - 반복(youtube_loop)이면 시작~끝 구간을 계속 반복한다 (youtube-loop.tsx)
 *   media_url   → R2 의 짧은 영상 (움짤처럼 자동 반복 재생)
 */
export function ItemMedia({
  youtubeUrl,
  youtubeStart,
  youtubeEnd = null,
  youtubeLoop = false,
  mediaUrl,
  title,
  labels,
}: {
  youtubeUrl: string | null;
  youtubeStart: number | null;
  youtubeEnd?: number | null;
  youtubeLoop?: boolean;
  mediaUrl: string | null;
  title: string;
  labels: Dictionary["video"];
}) {
  const yt = parseYouTube(youtubeUrl);
  if (!yt && !mediaUrl) return null;

  const start = youtubeStart ?? yt?.start ?? 0;
  const end = youtubeEnd && youtubeEnd > start ? youtubeEnd : null;

  return (
    <MediaToggle showLabel={labels.show} hideLabel={labels.hide}>
      {/* YouTube 는 플레이어 높이보다 한 단계 높은 화질을 고른다. 최대 폭 1024px(높이 576px)이면 720p 가 선택된다 */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3">
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
        {yt &&
          (end && youtubeLoop ? (
            <YouTubeLoop id={yt.id} start={start} end={end} title={title} labels={labels} />
          ) : (
            <iframe
              src={youTubeEmbedUrl(yt.id, start || null, end)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="aspect-video w-full border border-border bg-black"
            />
          ))}
      </div>
    </MediaToggle>
  );
}
