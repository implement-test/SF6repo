import Link from "next/link";
import type { Combo, Setup } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { parseYouTube } from "@/lib/youtube";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, Tag } from "./badges";
import { ItemMedia } from "./media";
import { PracticeView } from "./practice-view";
import { Collapsible } from "./collapsible";
import { EditButton } from "./admin/admin-context";

export function SetupCard({
  setup,
  locale,
  dict,
  situationNames,
  linkedCombos,
  latestPatchId,
  authors,
  characterSlug,
}: {
  setup: Setup;
  locale: Locale;
  dict: Dictionary;
  situationNames: Record<string, string>;
  linkedCombos: Combo[];
  latestPatchId: number | null;
  authors: Record<string, string>;
  characterSlug: string;
}) {
  const t = dict.setup;
  const title = pickLocalized(setup.title, locale);
  const description = setup.description ? pickLocalized(setup.description, locale) : null;
  const outdated = latestPatchId !== null && setup.patch_id !== latestPatchId;
  const createdBy = setup.created_by ? authors[setup.created_by] : undefined;
  const updatedBy = setup.updated_by ? authors[setup.updated_by] : undefined;
  const hasMedia = !!setup.media_url || !!parseYouTube(setup.youtube_url);

  return (
    <article
      id={`setup-${setup.id}`}
      data-level={setup.target_level}
      className="setup-card relative flex scroll-mt-40 flex-col gap-4 border border-border bg-surface py-4 pl-5 pr-4 transition-colors"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--lv-${setup.target_level})` }} />

      <header className="flex flex-wrap items-center gap-2">
        <LevelBadge level={setup.target_level} label={dict.level[setup.target_level]} />
        <h2 className="text-lg font-bold">{title.text}</h2>
        {!title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        {outdated && <OutdatedBadge label={dict.patch.outdated} />}
        {setup.situations.map((s) => (
          <Tag key={s} tone="accent">
            {situationNames[s] ?? s}
          </Tag>
        ))}
        <span className="ml-auto">
          <EditButton entity="setup" id={setup.id} scope={setup.character_id} />
        </span>
      </header>

      {linkedCombos.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="eyebrow">{t.combos}</p>
          <ul className="flex flex-col divide-y divide-border border border-border bg-inset">
            {linkedCombos.map((combo) => {
              const comboTitle = combo.title ? pickLocalized(combo.title, locale).text : null;
              return (
                <li key={combo.id} className="grid gap-2 px-3 py-2.5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/${characterSlug}/combos#combo-${combo.id}`}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {comboTitle ?? t.route} ↗
                    </Link>
                    <ControlNotation
                      classic={combo.notation_classic}
                      modern={combo.notation_modern}
                      classicOnlyLabel={dict.combo.classicOnly}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">{t.endPosition}</span>
                      <b>{combo.end_position ? dict.position[combo.end_position] : "—"}</b>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">{t.frameAfter}</span>
                      <b className="display text-lg tabular-nums text-highlight-text">{combo.frame_after ?? "—"}</b>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(setup.notation_classic || description) && (
        <section className="flex flex-col gap-2">
          {setup.notation_classic && (
            <div className="grid gap-2 border-l-2 border-accent bg-inset px-3 py-3 sm:grid-cols-[4.5rem_1fr]">
              <span className="eyebrow pt-1.5">{t.input}</span>
              <ControlNotation
                classic={setup.notation_classic}
                modern={setup.notation_modern}
                classicOnlyLabel={dict.combo.classicOnly}
              />
            </div>
          )}
          {description && (
            <p className="text-sm text-muted">
              {description.text} {!description.translated && <NotTranslatedBadge label={dict.notTranslated} />}
            </p>
          )}
        </section>
      )}

      {setup.practice && (
        <Collapsible showLabel={t.showPractice} hideLabel={t.hidePractice}>
          <PracticeView config={setup.practice} locale={locale} dict={dict} />
        </Collapsible>
      )}

      {setup.options.length > 0 && (
        <section className="grid gap-2 md:grid-cols-2">
          {setup.options.map((option, i) => {
            const desc = option.description ? pickLocalized(option.description, locale) : null;
            return (
              <div key={i} className="flex flex-col gap-2 border border-border bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="skew bg-highlight px-2 py-0.5 text-highlight-fg">
                    <span className="display text-sm">
                      {t.option} {option.label}
                    </span>
                  </span>
                </div>
                {option.classic && (
                  <ControlNotation classic={option.classic} modern={option.modern} classicOnlyLabel={dict.combo.classicOnly} />
                )}
                {desc && (
                  <p className="text-sm text-muted">
                    {desc.text} {!desc.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                  </p>
                )}
                {option.youtube_url && (
                  <ItemMedia
                    youtubeUrl={option.youtube_url}
                    youtubeStart={null}
                    mediaUrl={null}
                    title={`${title.text} ${t.option} ${option.label}`}
                    showLabel={dict.video.show}
                    hideLabel={dict.video.hide}
                  />
                )}
              </div>
            );
          })}
        </section>
      )}

      {hasMedia && (
        <ItemMedia
          youtubeUrl={setup.youtube_url}
          youtubeStart={setup.youtube_start}
          mediaUrl={setup.media_url}
          title={title.text}
          showLabel={dict.video.show}
          hideLabel={dict.video.hide}
        />
      )}

      <footer className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
        <span>
          {dict.combo.difficulty} <b className="text-fg">{dict.difficulty[setup.difficulty]}</b>
        </span>
        <span>{setup.created_date}</span>
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
    </article>
  );
}
