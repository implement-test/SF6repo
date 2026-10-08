import type { Dictionary } from "@/lib/i18n/dictionaries";
import { parseXPost, parseYouTube, youTubeEmbedUrl } from "@/lib/youtube";
import { MediaToggle } from "./media-toggle";
import { YouTubeLoop } from "./youtube-loop";
import { XPostEmbed } from "./x-post-embed";

/**
 * 항목에 붙은 영상. 버튼으로 펼치기/접기 (기본은 접힘), 가운데 정렬.
 *   YouTube 링크 → 플레이어 임베드
 *     - 시작: youtube_start 가 있으면 그 값, 없으면 링크의 t=
 *     - 끝(youtube_end)만 있으면 그 구간을 재생하고 멈춘다
 *     - 반복(youtube_loop)이면 시작~끝 구간을 계속 반복한다 (youtube-loop.tsx)
 *   X(구 트위터) 게시물 링크 → 게시물 카드 임베드 (X 는 영상만 따로 넣을 수 없다. 구간 설정은 쓰지 않는다)
 *   media_url   → R2 의 짧은 영상 (움짤처럼 자동 반복 재생)
 *                 YouTube · X 링크를 이 칸에 잘못 넣었으면 그 플레이어로 보여 준다
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
  // 짧은 영상 칸에 YouTube · X 링크가 들어 있으면 YouTube 칸으로 옮겨서 다룬다
  const mediaIsLink = !!parseYouTube(mediaUrl) || !!parseXPost(mediaUrl);
  if (mediaIsLink) {
    youtubeUrl = youtubeUrl || mediaUrl;
    mediaUrl = null;
  }
  const yt = parseYouTube(youtubeUrl);
  const xPost = yt ? null : parseXPost(youtubeUrl);
  if (!yt && !xPost && !mediaUrl) return null;

  const start = youtubeStart ?? yt?.start ?? 0;
  const end = youtubeEnd && youtubeEnd > start ? youtubeEnd : null;

  return (
    <MediaToggle showLabel={labels.show} hideLabel={labels.hide}>
      {/* YouTube 는 플레이어 크기(와 화면 배율)로 화질을 고른다. 1080p 가 골라지도록 카드 폭 전체를 쓴다 */}
      <div className="mx-auto flex w-full flex-col items-center gap-3">
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
        {xPost && youtubeUrl && (
          <XPostEmbed id={xPost.id} url={youtubeUrl} labels={{ loading: labels.xLoading, open: labels.xOpen }} />
        )}
      </div>
    </MediaToggle>
  );
}
