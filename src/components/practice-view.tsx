import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import type { PracticeConfig } from "@/lib/types";
import { Notation } from "./notation";
import { NotTranslatedBadge } from "./badges";

/** 트레이닝 모드 더미 설정 표시 (셋업, 프랙티스 세팅 페이지에서 함께 쓴다) */
export function PracticeView({ config, locale, dict }: { config: PracticeConfig; locale: Locale; dict: Dictionary }) {
  const t = dict.setup;
  const notes = config.notes ? pickLocalized(config.notes, locale) : null;
  const hasSlots = config.wakeup.length + config.after_guard.slots.length + config.after_hit.length > 0;

  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
      {config.guard && (
        <Row label={t.guard}>
          <span className="font-semibold">{t.guardValues[config.guard]}</span>
        </Row>
      )}
      <Row label={t.wakeup}>
        <Slots slots={config.wakeup} empty={t.noSlot} />
      </Row>
      <Row
        label={
          config.after_guard.count
            ? `${t.afterGuard} (${t.afterGuardN.replace("{n}", String(config.after_guard.count))})`
            : t.afterGuard
        }
      >
        <Slots slots={config.after_guard.slots} empty={t.noSlot} />
      </Row>
      <Row label={t.afterHit}>
        <Slots slots={config.after_hit} empty={t.noSlot} />
      </Row>
      {hasSlots && (
        <p className="text-xs text-muted sm:col-span-2">* {t.playback[config.playback]}</p>
      )}
      {notes && (
        <p className="border-t border-border pt-2 text-muted sm:col-span-2">
          {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        </p>
      )}
    </dl>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs font-semibold text-muted sm:pt-1.5">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function Slots({ slots, empty }: { slots: string[]; empty: string }) {
  if (slots.length === 0) return <span className="text-muted">{empty}</span>;
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {slots.map((slot, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span className="display text-xs text-muted">{i + 1}</span>
          <Notation notation={slot} />
        </li>
      ))}
    </ol>
  );
}
