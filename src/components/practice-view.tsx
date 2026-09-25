import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import type { PracticeConfig, PracticeRow } from "@/lib/types";
import { NotTranslatedBadge } from "./badges";

/**
 * 셋업 연습용 트레이닝 모드 더미 설정.
 * 다운 리버설 / 가드 리버설(카운트) / 데미지 복귀 리버설 표 3개. 커맨드는 글자로 적은 그대로 보여 준다.
 */
export function PracticeView({ config, locale, dict }: { config: PracticeConfig; locale: Locale; dict: Dictionary }) {
  const t = dict.setup;
  const notes = config.notes ? pickLocalized(config.notes, locale) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-3">
        <ReversalTable title={t.wakeup} rows={config.wakeup} locale={locale} dict={dict} />
        <ReversalTable title={t.guardReversal} rows={config.guard} locale={locale} dict={dict} withCount />
        <ReversalTable title={t.afterHit} rows={config.after_hit} locale={locale} dict={dict} />
      </div>
      {notes && (
        <p className="text-sm text-muted">
          {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
        </p>
      )}
    </div>
  );
}

function ReversalTable({
  title,
  rows,
  locale,
  dict,
  withCount = false,
}: {
  title: string;
  rows: PracticeRow[];
  locale: Locale;
  dict: Dictionary;
  withCount?: boolean;
}) {
  const t = dict.setup;
  const num = "w-14 px-2 py-1.5 text-center tabular-nums";
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <caption className="bg-surface-2 px-3 py-1.5 text-left text-xs font-bold">{title}</caption>
        <thead>
          <tr className="border-y border-border text-xs text-muted">
            <th className="px-3 py-1.5 text-left font-semibold">{t.command}</th>
            {withCount && <th className={`${num} font-semibold`}>{t.count}</th>}
            <th className={`${num} font-semibold`}>{t.delay}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={withCount ? 3 : 2} className="px-3 py-2 text-muted">
                {t.noSlot}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const command = pickLocalized(row.command, locale);
              return (
                <tr key={i}>
                  <td className="px-3 py-1.5">
                    {command.text} {!command.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                  </td>
                  {withCount && <td className={num}>{row.count ?? "—"}</td>}
                  <td className={num}>{row.delay ?? "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
