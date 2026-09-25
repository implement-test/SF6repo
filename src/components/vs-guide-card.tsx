import type { VsGuide } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { rosterBySlug } from "@/lib/roster";
import { parseYouTube } from "@/lib/youtube";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, PositionBadge, Tag } from "./badges";
import { ItemMedia } from "./media";
import { EditButton } from "./admin/admin-context";
import { FavoriteButton } from "./favorite-button";

/** Vs 가이드 한 항목: [대상 수준] [VS 상대] [주제] 제목 → 표기 → 내용 → 영상 */
export function VsGuideCard({
  guide,
  locale,
  dict,
  latestPatchId,
  authors,
  opponentCharacterId,
}: {
  guide: VsGuide;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
  authors: Record<string, string>;
  /** 상대 캐릭터도 사이트에 페이지가 있으면 그 id (그 캐릭터 관리자도 편집할 수 있다) */
  opponentCharacterId?: number;
}) {
  const opponent = rosterBySlug(guide.opponent);
  const opponentName = opponent ? pickLocalized(opponent.name, locale).text : guide.opponent;
  const title = guide.title ? pickLocalized(guide.title, locale) : null;
  const body = guide.body ? pickLocalized(guide.body, locale) : null;
  const outdated = latestPatchId !== null && guide.patch_id !== latestPatchId;
  const createdBy = guide.created_by ? authors[guide.created_by] : undefined;
  const hasMedia = !!guide.media_url || !!parseYouTube(guide.youtube_url);
  const scope = opponentCharacterId ? [guide.character_id, opponentCharacterId] : guide.character_id;

  return (
    <article
      id={`vs-${guide.id}`}
      data-level={guide.target_level}
      className="relative flex flex-col gap-3 border border-border bg-surface py-4 pr-4 pl-5 transition-colors hover:border-border-strong"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--lv-${guide.target_level})` }} />

      <header className="flex flex-wrap items-center gap-2">
        <LevelBadge level={guide.target_level} label={dict.level[guide.target_level]} />
        <PositionBadge label={`VS ${opponentName}`} />
        <Tag tone="accent">{dict.vs.topics[guide.topic]}</Tag>
        {title && <h2 className="font-bold">{title.text}</h2>}
        {title && !title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        {outdated && <OutdatedBadge label={dict.patch.outdated} />}
        <span className="ml-auto flex items-center gap-1.5">
          <FavoriteButton kind="vs" id={guide.id} labels={dict.favorite} />
          <EditButton entity="vs" id={guide.id} scope={scope} />
        </span>
      </header>

      {guide.notation_classic && (
        <div className="border-l-2 border-accent bg-inset px-3 py-3">
          <ControlNotation
            classic={guide.notation_classic}
            modern={guide.notation_modern}
            classicOnlyLabel={dict.combo.classicOnly}
          />
        </div>
      )}

      {body && (
        <p className="text-sm whitespace-pre-line">
          {body.text} {!body.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        </p>
      )}

      {hasMedia && (
        <ItemMedia
          youtubeUrl={guide.youtube_url}
          youtubeStart={guide.youtube_start}
          youtubeEnd={guide.youtube_end}
          youtubeLoop={guide.youtube_loop}
          mediaUrl={guide.media_url}
          title={title?.text ?? opponentName}
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
      </footer>
    </article>
  );
}
