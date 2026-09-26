import type { Move } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { parseYouTube } from "@/lib/youtube";
import { ControlNotation } from "./notation";
import { NotTranslatedBadge, OutdatedBadge } from "./badges";
import { ItemMedia } from "./media";
import { EditButton } from "./admin/admin-context";

/** 프레임 값 색: + 는 유리(초록), - 는 불리(주황) */
function frameTone(value: string | null) {
  if (!value) return undefined;
  if (/^\s*\+/.test(value)) return "var(--drive)";
  if (/^\s*[-−]/.test(value)) return "var(--warn)";
  return undefined;
}

/** 커맨드 한 개: 이름 · 커맨드 · 설명 + 오른쪽 프레임 데이터 (supercombo 위키의 기술 카드 참고) */
export function MoveCard({
  move,
  locale,
  dict,
  latestPatchId,
}: {
  move: Move;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
}) {
  const name = pickLocalized(move.name, locale);
  const notes = move.notes ? pickLocalized(move.notes, locale) : null;
  const outdated = latestPatchId !== null && move.patch_id !== latestPatchId;
  const hasMedia = !!move.media_url || !!parseYouTube(move.youtube_url);
  const stats: { label: string; value: string | null; tone?: string }[] = [
    { label: dict.moves.damage, value: move.damage },
    { label: dict.moves.startup, value: move.startup },
    { label: dict.moves.active, value: move.active },
    { label: dict.moves.recovery, value: move.recovery },
    { label: dict.moves.onHit, value: move.on_hit, tone: frameTone(move.on_hit) },
    { label: dict.moves.onBlock, value: move.on_block, tone: frameTone(move.on_block) },
  ];

  return (
    <article
      id={`move-${move.id}`}
      className="grid border border-border bg-surface transition-colors hover:border-border-strong lg:grid-cols-[1fr_auto]"
    >
      <div className="flex min-w-0 flex-col gap-2.5 px-4 py-3">
        <header className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">{name.text}</h3>
          {!name.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          {outdated && <OutdatedBadge label={dict.patch.outdated} />}
          <span className="ml-auto">
            <EditButton entity="move" id={move.id} scope={move.character_id} />
          </span>
        </header>
        <div className="border-l-2 border-accent bg-inset px-3 py-2">
          <ControlNotation classic={move.input_classic} modern={move.input_modern} classicOnlyLabel={dict.combo.classicOnly} />
        </div>
        {notes && (
          <p className="text-sm whitespace-pre-line text-muted">
            {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-3 border-t border-border bg-surface-2/60 sm:grid-cols-6 lg:border-t-0 lg:border-l">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center gap-0.5 border-border px-3 py-2.5 not-last:border-r lg:min-w-[4.5rem]">
            <dt className="eyebrow whitespace-nowrap">{s.label}</dt>
            <dd className="display text-lg tabular-nums" style={s.tone ? { color: s.tone } : undefined}>
              {s.value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {hasMedia && (
        <div className="border-t border-border px-4 py-3 lg:col-span-2">
          <ItemMedia
            youtubeUrl={move.youtube_url}
            youtubeStart={move.youtube_start}
            youtubeEnd={move.youtube_end}
            youtubeLoop={move.youtube_loop}
            mediaUrl={move.media_url}
            title={name.text}
            labels={dict.video}
          />
        </div>
      )}
    </article>
  );
}
