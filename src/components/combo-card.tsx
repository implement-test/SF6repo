import type { Combo } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { ControlNotation } from "./notation";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, Tag } from "./badges";
import { SegmentGauge } from "./gauges";
import { EditButton } from "./admin/admin-context";

export function ComboCard({
  combo,
  locale,
  dict,
  latestPatchId,
}: {
  combo: Combo;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
}) {
  const title = combo.title ? pickLocalized(combo.title, locale) : null;
  const notes = combo.notes ? pickLocalized(combo.notes, locale) : null;
  const outdated = latestPatchId !== null && combo.patch_id !== latestPatchId;
  const position =
    combo.position_end && combo.position_end !== combo.position_start
      ? `${dict.position[combo.position_start]} → ${dict.position[combo.position_end]}`
      : dict.position[combo.position_start];

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
          <span className="display text-lg text-muted tabular-nums">#{String(combo.id).padStart(3, "0")}</span>
          <LevelBadge level={combo.target_level} label={dict.level[combo.target_level]} />
          {title && <h2 className="font-bold">{title.text}</h2>}
          {title && !title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          {outdated && <OutdatedBadge label={dict.patch.outdated} />}
          <span className="ml-auto">
            <EditButton entity="combo" id={combo.id} />
          </span>
        </header>

        <div className="border-l-2 border-accent bg-inset px-3 py-3">
          <ControlNotation
            classic={combo.notation_classic}
            modern={combo.notation_modern}
            classicOnlyLabel={dict.combo.classicOnly}
          />
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
      </aside>
    </article>
  );
}
