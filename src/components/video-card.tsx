import type { Video } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { formatClock } from "@/lib/youtube";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge } from "./badges";
import { EditButton } from "./admin/admin-context";
import { VideoPlayer } from "./video-player";

/** 추천 영상 카드: 썸네일(누르면 재생) → [대상 수준] 제목 · 채널 · 언어 · 구간 → 설명 */
export function VideoCard({
  video,
  locale,
  dict,
  latestPatchId,
}: {
  video: Video;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
}) {
  const title = pickLocalized(video.title, locale);
  const description = video.description ? pickLocalized(video.description, locale) : null;
  const outdated = latestPatchId !== null && video.patch_id !== latestPatchId;
  const segment =
    video.youtube_start || video.youtube_end
      ? `${formatClock(video.youtube_start ?? 0)}${video.youtube_end ? ` ~ ${formatClock(video.youtube_end)}` : " ~"}`
      : null;

  return (
    <article
      id={`video-${video.id}`}
      className="flex h-full flex-col border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="border-b-2" style={{ borderColor: `var(--lv-${video.target_level})` }}>
        <VideoPlayer
          url={video.youtube_url}
          start={video.youtube_start}
          end={video.youtube_end}
          loop={video.youtube_loop}
          title={title.text}
          labels={dict.video}
          playLabel={dict.videos.play}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <header className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 font-bold leading-snug">
            {title.text} {!title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          </h2>
          <EditButton entity="video" id={video.id} scope={video.character_id} />
        </header>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <LevelBadge level={video.target_level} label={dict.level[video.target_level]} />
          <span className="border border-border-strong px-1.5 py-0.5">{dict.videos.languages[video.language]}</span>
          {video.channel && <span className="font-semibold text-fg">{video.channel}</span>}
          {segment && <span className="tabular-nums">▶ {segment}{video.youtube_loop ? " ↻" : ""}</span>}
          {outdated && <OutdatedBadge label={dict.patch.outdated} />}
        </p>
        {description && (
          <p className="text-sm whitespace-pre-line text-muted">
            {description.text} {!description.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          </p>
        )}
      </div>
    </article>
  );
}
