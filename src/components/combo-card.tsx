import type { Combo } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { parseYouTube } from "@/lib/youtube";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, Tag } from "./badges";
import { SegmentGauge } from "./gauges";
import { ItemMedia } from "./media";
import { EditButton } from "./admin/admin-context";

export function ComboCard({
  combo,
  locale,
  dict,
  latestPatchId,
  authors,
}: {
  combo: Combo;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
  authors: Record<string, string>;
}) {
  const createdBy = combo.created_by ? authors[combo.created_by] : undefined;
  const updatedBy = combo.updated_by ? authors[combo.updated_by] : undefined;
  const title = combo.title ? pickLocalized(combo.title, locale) : null;
  const notes = combo.notes ? pickLocalized(combo.notes, locale) : null;
  const outdated = latestPatchId !== null && combo.patch_id !== latestPatchId;
  const position =
    combo.position_end && combo.position_end !== combo.position_start
      ? `${dict.position[combo.position_start]} → ${dict.position[combo.position_end]}`
      : dict.position[combo.position_start];
  const starters = combo.starters ?? [];
  const hasMedia = !!combo.media_url || !!parseYouTube(combo.youtube_url);

  return (
    <article
      id={`combo-${combo.id}`}
      data-level={combo.target_level}
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
          <span className="ml-auto">
            <EditButton entity="combo" id={combo.id} scope={combo.character_id} />
          </span>
        </header>

        <div className="flex flex-col border-l-2 border-accent bg-inset">
          {starters.length > 0 && (
            <div className="grid gap-2 px-3 py-3 sm:grid-cols-[4.5rem_1fr]">
              <span className="eyebrow pt-1.5">{dict.combo.starter}</span>
              <ol className="flex flex-col gap-2">
                {starters.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className={`display w-4 pt-1 text-right text-base ${i === 0 ? "text-highlight-text" : "text-muted"}`}
                      title={i === 0 ? dict.combo.damageBasis : undefined}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <ControlNotation classic={s.classic} modern={s.modern} classicOnlyLabel={dict.combo.classicOnly} />
                    </div>
                  </li>
                ))}
              </ol>
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
              {dict.hitState[h]}
            </Tag>
          ))}
          <Tag>{position}</Tag>
        </div>

        {notes && (
          <p className="text-sm text-muted">
            {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          </p>
        )}
      </div>

      <aside className="flex flex-col justify-between gap-3 border-t border-border bg-surface-2/60 px-4 py-4 md:border-l md:border-t-0">
        <div>
          <p className="eyebrow">{dict.combo.damage}</p>
          <p className="display text-4xl tabular-nums text-highlight-text">
            {combo.damage !== null ? combo.damage.toLocaleString() : "—"}
          </p>
          {starters.length > 0 && combo.damage !== null && (
            <p className="mt-1 text-xs text-muted">* {dict.combo.damageBasis}</p>
          )}
        </div>
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
            mediaUrl={combo.media_url}
            title={title?.text ?? combo.notation_classic}
            showLabel={dict.video.show}
            hideLabel={dict.video.hide}
          />
        </div>
      )}
    </article>
  );
}
