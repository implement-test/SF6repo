import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import type { PracticeConfig, PracticeRow } from "@/lib/types";
import { NotTranslatedBadge } from "./badges";

/**
 * 셋업 연습용 트레이닝 모드 더미 설정.
 * 다운 리버설 / 가드 리버설(카운트) / 데미지 복귀 리버설 표 3개. 커맨드는 글자로 적은 그대로 보여 준다.
 * 세 표는 가장 줄이 많은 표에 맞춰 빈 줄을 채우고, 줄 높이를 고정해서 나란히 놓았을 때 줄이 맞게 한다.
 */
export function PracticeView({ config, locale, dict }: { config: PracticeConfig; locale: Locale; dict: Dictionary }) {
  const t = dict.setup;
  const notes = config.notes ? pickLocalized(config.notes, locale) : null;
  const rowCount = Math.max(1, config.wakeup.length, config.guard.length, config.after_hit.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-start gap-3 lg:grid-cols-3">
        <ReversalTable title={t.wakeup} rows={config.wakeup} rowCount={rowCount} locale={locale} dict={dict} />
        <ReversalTable title={t.guardReversal} rows={config.guard} rowCount={rowCount} locale={locale} dict={dict} withCount />
        <ReversalTable title={t.afterHit} rows={config.after_hit} rowCount={rowCount} locale={locale} dict={dict} />
      </div>
      {notes && (
        <p className="text-sm whitespace-pre-line text-muted">
          {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        </p>
      )}
    </div>
  );
}

function ReversalTable({
  title,
  rows,
  rowCount,
  locale,
  dict,
  withCount = false,
}: {
  title: string;
  rows: PracticeRow[];
  rowCount: number;
  locale: Locale;
  dict: Dictionary;
  withCount?: boolean;
}) {
  const t = dict.setup;
  const cols = withCount ? 3 : 2;
  // 줄 높이 고정. 긴 커맨드는 말줄임(…)하고 마우스를 올리면 전체를 보여 준다.
  const row = "h-9";
  const num = "w-16 px-2 text-center align-middle tabular-nums";
  const blanks = Math.max(0, rowCount - Math.max(rows.length, 1));

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full table-fixed text-sm">
        <caption className="bg-surface-2 px-3 py-1.5 text-center text-xs font-bold">{title}</caption>
        <thead>
          <tr className={`${row} border-y border-border text-xs text-muted`}>
            <th className="px-3 text-center align-middle font-semibold">{t.command}</th>
            {withCount && <th className={`${num} font-semibold`}>{t.count}</th>}
            <th className={`${num} font-semibold`}>{t.delay}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <tr className={row}>
              <td colSpan={cols} className="px-3 align-middle text-muted">
                {t.noSlot}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const command = pickLocalized(r.command, locale);
              return (
                <tr key={i} className={row}>
                  <td className="truncate px-3 align-middle" title={command.text}>
                    {command.text} {!command.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                  </td>
                  {withCount && <td className={num}>{r.count ?? "—"}</td>}
                  <td className={num}>{r.delay ?? "—"}</td>
                </tr>
              );
            })
          )}
          {Array.from({ length: blanks }, (_, i) => (
            <tr key={`blank-${i}`} className={row} aria-hidden>
              <td colSpan={cols} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
