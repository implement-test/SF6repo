import type { CommonGuide } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { isVideoLink } from "@/lib/youtube";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, Tag } from "./badges";
import { ItemMedia } from "./media";
import { CardShell } from "./card-shell";
import { EditButton } from "./admin/admin-context";
import { FavoriteButton } from "./favorite-button";

/**
 * 공통 공략의 시스템 글 한 편: [대상 수준] [주제] 제목 → 내용 → 예시 표기 → 영상.
 * 콤보 · 셋업처럼 접힌 카드라 제목 줄만 보이고, 누르면 펼친다. 편집은 최고/부 관리자만 (scope 없음).
 */
export function CommonGuideCard({
  guide,
  locale,
  dict,
  latestPatchId,
  authors,
}: {
  guide: CommonGuide;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
  authors: Record<string, string>;
}) {
  const title = pickLocalized(guide.title, locale);
  const body = guide.body ? pickLocalized(guide.body, locale) : null;
  const outdated = latestPatchId !== null && guide.patch_id !== latestPatchId;
  const createdBy = guide.created_by ? authors[guide.created_by] : undefined;
  const updatedBy = guide.updated_by ? authors[guide.updated_by] : undefined;
  const hasMedia = !!guide.media_url || isVideoLink(guide.youtube_url);

  return (
    <CardShell
      id={`guide-${guide.id}`}
      level={guide.target_level}
      dataLevel={guide.target_level}
      header={
        <>
          <LevelBadge level={guide.target_level} label={dict.level[guide.target_level]} />
          <Tag tone="accent">{dict.guide.topics[guide.topic] ?? guide.topic}</Tag>
          <h2 className="text-lg font-bold">{title.text}</h2>
          {!title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          {outdated && <OutdatedBadge label={dict.patch.outdated} />}
        </>
      }
      actions={
        <>
          <FavoriteButton kind="guide" id={guide.id} labels={dict.favorite} />
          <EditButton entity="guide" id={guide.id} />
        </>
      }
    >
      <div className="flex flex-col gap-4 py-4 pl-5 pr-4">
        {body && (
          <p className="text-sm whitespace-pre-line">
            {body.text} {!body.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          </p>
        )}

        {guide.notation_classic && (
          <section className="flex flex-col gap-2 border border-border bg-inset px-3 py-2.5">
            <span className="eyebrow">{dict.guide.example}</span>
            <ControlNotation
              classic={guide.notation_classic}
              modern={guide.notation_modern}
              classicOnlyLabel={dict.combo.classicOnly}
            />
          </section>
        )}

        {hasMedia && (
          <ItemMedia
            youtubeUrl={guide.youtube_url}
            youtubeStart={guide.youtube_start}
            youtubeEnd={guide.youtube_end}
            youtubeLoop={guide.youtube_loop}
            mediaUrl={guide.media_url}
            title={title.text}
            labels={dict.video}
          />
        )}

        <footer className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
          <span>{guide.created_date}</span>
          {createdBy && (
            <span>
              {dict.author.created} <b className="font-semibold text-fg">{createdBy}</b>
            </span>
          )}
          {updatedBy && updatedBy !== createdBy && (
            <span>
              {dict.author.updated} <b className="font-semibold text-fg">{updatedBy}</b>
            </span>
          )}
        </footer>
      </div>
    </CardShell>
  );
}
