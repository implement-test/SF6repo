import type { VsGuide } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { rosterBySlug } from "@/lib/roster";
import { isVideoLink } from "@/lib/youtube";
import { formatFrameRange } from "@/lib/vs-patterns";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, PositionBadge, Tag } from "./badges";
import { ItemMedia } from "./media";
import { EditButton } from "./admin/admin-context";
import { FavoriteButton } from "./favorite-button";

/**
 * Vs 가이드 한 포스트: [대상 수준] [VS 상대] [주제] 제목 → 공용 내용 → 상대 패턴 여러 개 → 영상.
 * 상대 패턴마다 기술 표기 · 이름 · 프레임 범위 · 설명 · 영상, 그 아래 대응 여러 개(표기 · 확정/거리 한정 · 설명).
 */
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
  const hasMedia = !!guide.media_url || isVideoLink(guide.youtube_url);
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
        <Tag tone="accent">{dict.vs.topics[guide.topic] ?? guide.topic}</Tag>
        {title && <h2 className="font-bold">{title.text}</h2>}
        {title && !title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        {outdated && <OutdatedBadge label={dict.patch.outdated} />}
        <span className="ml-auto flex items-center gap-1.5">
          <FavoriteButton kind="vs" id={guide.id} labels={dict.favorite} />
          <EditButton entity="vs" id={guide.id} scope={scope} />
        </span>
      </header>

      {/* 공용 내용 */}
      {body && (
        <p className="text-sm whitespace-pre-line">
          {body.text} {!body.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        </p>
      )}

      {/* 상대 패턴마다: 상대 기술 → 대응들 */}
      {guide.patterns.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="eyebrow">{dict.vs.patterns}</h3>
          <ol className="flex flex-col gap-2.5">
            {guide.patterns.map((pattern, i) => {
              const name = pattern.name ? pickLocalized(pattern.name, locale) : null;
              const note = pattern.note ? pickLocalized(pattern.note, locale) : null;
              const frames = formatFrameRange(pattern.frame_min, pattern.frame_max);
              const frameLabel = guide.topic === "block_punish" ? dict.vs.onBlock : dict.vs.frame;
              return (
                <li key={i} className="flex flex-col border border-border bg-inset">
                  {/* 상대 패턴 머리 줄 */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-surface-2 px-3 py-2.5">
                    <span className="display text-base text-accent">{i + 1}</span>
                    {pattern.classic && (
                      <ControlNotation classic={pattern.classic} modern={pattern.modern} classicOnlyLabel={dict.combo.classicOnly} />
                    )}
                    {name && (
                      <span className="font-bold">
                        {name.text} {!name.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                      </span>
                    )}
                    {frames && (
                      <span className="ml-auto flex items-baseline gap-1.5 border border-border-strong px-2 py-0.5">
                        <span className="text-xs text-muted">{frameLabel}</span>
                        <b className="display tabular-nums text-highlight-text">{frames}</b>
                      </span>
                    )}
                  </div>
                  {note && (
                    <p className="px-3 pt-2.5 text-sm whitespace-pre-line text-muted">
                      {note.text} {!note.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                    </p>
                  )}
                  {/* 대응들 */}
                  {pattern.responses.length > 0 && (
                    <ul className="flex flex-col py-1">
                      {pattern.responses.map((response, j) => {
                        const rNote = response.note ? pickLocalized(response.note, locale) : null;
                        return (
                          <li key={j} className="flex gap-2.5 px-3 py-2 not-first:border-t not-first:border-border">
                            <span aria-hidden className="pt-1 text-muted">
                              └
                            </span>
                            <div className="flex min-w-0 flex-col gap-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {response.classic && (
                                  <ControlNotation
                                    classic={response.classic}
                                    modern={response.modern}
                                    classicOnlyLabel={dict.combo.classicOnly}
                                  />
                                )}
                                {response.punish && (
                                  <span className="vs-punish" data-punish={response.punish}>
                                    {dict.vs.punish[response.punish]}
                                  </span>
                                )}
                              </div>
                              {rNote && (
                                <p className="text-sm whitespace-pre-line text-muted">
                                  {rNote.text} {!rNote.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {isVideoLink(pattern.youtube_url) && (
                    <div className="border-t border-border p-3">
                      <ItemMedia
                        youtubeUrl={pattern.youtube_url}
                        youtubeStart={pattern.youtube_start}
                        youtubeEnd={pattern.youtube_end}
                        youtubeLoop={pattern.youtube_loop}
                        mediaUrl={null}
                        title={name?.text ?? pattern.classic}
                        labels={dict.video}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
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
