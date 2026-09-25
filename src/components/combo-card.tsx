import Link from "next/link";
import type { Combo } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { parseYouTube } from "@/lib/youtube";
import { damageBasisIndex, flattenStarters } from "@/lib/starters";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, Tag } from "./badges";
import { SegmentGauge } from "./gauges";
import { ItemMedia } from "./media";
import { EditButton } from "./admin/admin-context";
import { ShareButton } from "./share-button";

export function ComboCard({
  combo,
  locale,
  dict,
  latestPatchId,
  authors,
  characterSlug,
  linkedSetups = [],
  embedded = false,
}: {
  combo: Combo;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
  authors: Record<string, string>;
  characterSlug: string;
  /** 이 콤보에서 이어지는 셋업. preview 는 마우스를 올렸을 때 보여 줄 텍스트 */
  linkedSetups?: { id: number; title: string; preview: string }[];
  /** 다른 사이트에 퍼간 화면: 퍼가기·수정 버튼을 빼고, 방문자의 대상 수준 숨김 설정도 무시한다 */
  embedded?: boolean;
}) {
  const createdBy = combo.created_by ? authors[combo.created_by] : undefined;
  const updatedBy = combo.updated_by ? authors[combo.updated_by] : undefined;
  const title = combo.title ? pickLocalized(combo.title, locale) : null;
  const notes = combo.notes ? pickLocalized(combo.notes, locale) : null;
  const outdated = latestPatchId !== null && combo.patch_id !== latestPatchId;
  const position = dict.position[combo.position_start] ?? combo.position_start;
  const groups = (combo.starters ?? []).filter((g) => g.starters.length > 0);
  const starters = flattenStarters(groups);
  // 그룹마다 앞 그룹들의 시동기 수 (번호를 이어 매기기 위해)
  const groupOffsets = groups.map((_, g) => groups.slice(0, g).reduce((sum, x) => sum + x.starters.length, 0));
  // 데미지 기준 시동기 (관리자가 고른 것, 없으면 첫 번째)
  const basisIndex = damageBasisIndex(groups);
  // 직접 고른 기준은 데미지가 아직 비어 있어도 강조한다 (고르지 않았으면 데미지가 있을 때만 첫 번째를 강조)
  const basisChosen = starters.some((s) => s.damage_basis);
  const basisNote = dict.combo.damageBasis.replace("{n}", String(basisIndex + 1));
  const hasMedia = !!combo.media_url || !!parseYouTube(combo.youtube_url);

  return (
    <article
      id={`combo-${combo.id}`}
      data-level={embedded ? undefined : combo.target_level}
      className="group relative grid border border-border bg-surface transition-colors hover:border-border-strong md:grid-cols-[1fr_15rem]"
    >
      {/* 대상 수준 색 띠 */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--lv-${combo.target_level})` }} />

      <div className="flex min-w-0 flex-col gap-3 py-4 pl-5 pr-4">
        <header className="flex flex-wrap items-center gap-2">
          <LevelBadge level={combo.target_level} label={dict.level[combo.target_level]} />
          {title && <h2 className="font-bold">{title.text}</h2>}
          {title && !title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          {outdated && <OutdatedBadge label={dict.patch.outdated} />}
          {!embedded && (
            <span className="ml-auto flex items-center gap-1.5">
              <ShareButton kind="combo" id={combo.id} labels={dict.share} />
              <EditButton entity="combo" id={combo.id} scope={combo.character_id} />
            </span>
          )}
        </header>

        <div className="flex flex-col border-l-2 border-accent bg-inset">
          {starters.length > 0 && (
            <div className="grid gap-2 px-3 py-3 sm:grid-cols-[4.5rem_1fr]">
              <span className="eyebrow pt-1.5">{dict.combo.starter}</span>
              <div className="flex flex-col gap-3">
                {groups.map((group, g) => (
                  <div key={g} className="flex flex-col gap-2">
                    {/* 그룹 이름 (프리셋 이름 등). 이름 없는 그룹은 제목 없이 */}
                    {group.name && (
                      <span className="flex items-center gap-2 text-xs font-bold text-muted">
                        <span aria-hidden className="h-px w-3 bg-border-strong" />
                        {group.name}
                      </span>
                    )}
                    <ol className="flex flex-col gap-2">
                      {group.starters.map((s, i) => {
                        // 번호는 그룹을 넘어 이어진다. 데미지 기준 시동기는 강조한다
                        const n = groupOffsets[g] + i + 1;
                        const isBasis = (combo.damage !== null || basisChosen) && n - 1 === basisIndex;
                        return (
                          <li
                            key={i}
                            className={`flex items-start gap-2.5 ${isBasis ? "-mx-2 border-l-2 border-highlight bg-highlight/10 px-2 py-1" : ""}`}
                          >
                            <span
                              className={`display w-4 pt-1 text-right text-base ${isBasis ? "text-highlight-text" : "text-muted"}`}
                              title={isBasis ? basisNote : undefined}
                            >
                              {n}
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <ControlNotation classic={s.classic} modern={s.modern} classicOnlyLabel={dict.combo.classicOnly} />
                              {isBasis && (
                                <span className="border border-highlight/60 px-1.5 py-0.5 text-[0.65rem] font-bold text-highlight-text">
                                  {dict.combo.damageBasisTag}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={`grid gap-2 px-3 py-3 ${starters.length > 0 ? "border-t border-border sm:grid-cols-[4.5rem_1fr]" : ""}`}>
            {starters.length > 0 && <span className="eyebrow pt-1.5">{dict.combo.route}</span>}
            <div className="flex min-w-0 items-start gap-2">
              {starters.length > 0 && <span className="pt-1 text-muted">→</span>}
              <div className="min-w-0">
                <ControlNotation
                  classic={combo.notation_classic}
                  modern={combo.notation_modern}
                  classicOnlyLabel={dict.combo.classicOnly}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {combo.hit_states.map((h) => (
            <Tag key={h} tone={h === "normal" ? "default" : "accent"}>
              {dict.hitState[h] ?? h}
            </Tag>
          ))}
          <Tag>{position}</Tag>
        </div>

        {notes && (
          <p className="text-sm whitespace-pre-line text-muted">
            {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          </p>
        )}

        {linkedSetups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow">{dict.setup.linked}</span>
            {linkedSetups.map((s) => (
              <Link
                key={s.id}
                href={`/${characterSlug}/setups#setup-${s.id}`}
                title={s.preview}
                className="skew border border-highlight/60 px-2.5 py-0.5 text-xs font-bold text-highlight-text transition-colors hover:bg-highlight hover:text-highlight-fg"
              >
                <span>{s.title} →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="flex flex-col justify-between gap-3 border-t border-border bg-surface-2/60 px-4 py-4 md:border-l md:border-t-0">
        <div>
          <p className="eyebrow">{dict.combo.damage}</p>
          <p className="display text-4xl tabular-nums text-highlight-text">
            {combo.damage !== null ? combo.damage.toLocaleString() : "—"}
          </p>
          {starters.length > 0 && combo.damage !== null && (
            <p className="mt-1 text-xs text-muted">* {basisNote}</p>
          )}
        </div>
        {combo.frame_after && (
          <div>
            <p className="eyebrow">{dict.combo.frameAfter}</p>
            <p className="display text-2xl tabular-nums">{combo.frame_after}</p>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <SegmentGauge label="Drive" value={combo.drive_cost} max={6} color="var(--drive)" />
          <SegmentGauge label="SA" value={combo.sa_cost} max={3} color="var(--sa)" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {dict.combo.difficulty} <b className="text-fg">{dict.difficulty[combo.difficulty]}</b>
          </span>
          <span>{combo.created_date}</span>
        </div>
        {(createdBy || updatedBy) && (
          <p className="text-xs text-muted">
            {createdBy && (
              <>
                {dict.author.created} <b className="font-semibold text-fg">{createdBy}</b>
              </>
            )}
            {updatedBy && updatedBy !== createdBy && (
              <>
                {createdBy && " · "}
                {dict.author.updated} <b className="font-semibold text-fg">{updatedBy}</b>
              </>
            )}
          </p>
        )}
      </aside>

      {hasMedia && (
        <div className="border-t border-border py-4 pl-5 pr-4 md:col-span-2">
          <ItemMedia
            youtubeUrl={combo.youtube_url}
            youtubeStart={combo.youtube_start}
            youtubeEnd={combo.youtube_end}
            youtubeLoop={combo.youtube_loop}
            mediaUrl={combo.media_url}
            title={title?.text ?? combo.notation_classic}
            labels={dict.video}
          />
        </div>
      )}
    </article>
  );
}
