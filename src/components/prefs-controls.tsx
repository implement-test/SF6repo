"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { TARGET_LEVELS } from "@/lib/types";
import { usePrefs } from "./prefs-store";

/**
 * 선택 상태의 색은 globals.css 가 <html data-*> 를 보고 칠한다 (data-pref / data-value).
 * 그래서 하이드레이션 전에도 올바른 버튼이 선택된 것으로 보인다.
 */
function Segmented<T extends string>({
  pref,
  label,
  value,
  options,
  onChange,
}: {
  pref: "notation" | "control";
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-pref={pref}
          data-value={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="skew border border-border-strong px-3 py-1 text-sm font-bold text-muted transition-colors hover:text-fg"
        >
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** 헤더 오른쪽: 언어 / 테마 */
export function SitePrefs({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [prefs, update] = usePrefs();
  const router = useRouter();

  function changeLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => changeLocale(e.target.value as Locale)}
        className="h-9 border border-border bg-surface px-2 text-sm font-semibold"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => update({ theme: prefs.theme === "dark" ? "light" : "dark" })}
        aria-label={dict.prefs.theme}
        className="grid size-9 place-items-center border border-border bg-surface text-muted transition-colors hover:text-highlight"
      >
        {/* 현재 테마는 CSS 로 판단한다 (하이드레이션 전 깜빡임 방지) */}
        <svg viewBox="0 0 24 24" className="size-4 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg viewBox="0 0 24 24" className="hidden size-4 dark:block" fill="currentColor" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </button>
    </div>
  );
}

function FilterGroup({ label, sub, children }: { label: string; sub: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">{sub}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/** 캐릭터 페이지 상단: 대상 수준 / 콤보 표시 / 조작 방식 */
/** 콘텐츠 목록 탭(콤보·셋업·Vs 가이드)에서만 보인다. 개요(/{캐릭터})·커맨드 리스트에는 거를 목록이 없어서 숨긴다 */
const HIDE_FILTERS_ON = [new RegExp(`^(/(${LOCALES.join("|")}))?/[^/]+/?$`), /\/moves\/?$/];

export function ContentFilters({ dict }: { dict: Dictionary }) {
  const [prefs, update] = usePrefs();
  const pathname = usePathname();

  function toggleLevel(level: (typeof TARGET_LEVELS)[number]) {
    const hidden = prefs.hidden.includes(level)
      ? prefs.hidden.filter((l) => l !== level)
      : [...prefs.hidden, level];
    update({ hidden });
  }

  if (HIDE_FILTERS_ON.some((re) => re.test(pathname))) return null;

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 border border-border bg-surface px-4 py-3">
      <FilterGroup label={dict.prefs.level} sub="Level">
        {TARGET_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            data-pref="level"
            data-value={level}
            aria-pressed={!prefs.hidden.includes(level)}
            title={dict.levelHint[level]}
            onClick={() => toggleLevel(level)}
            className="level-chip skew px-3 py-1 text-sm font-bold"
          >
            <span>{dict.level[level]}</span>
          </button>
        ))}
      </FilterGroup>
      <FilterGroup label={dict.prefs.notation} sub="Display">
        <Segmented
          pref="notation"
          label={dict.prefs.notation}
          value={prefs.notation}
          onChange={(notation) => update({ notation })}
          options={[
            { value: "image", label: dict.prefs.image },
            { value: "text", label: dict.prefs.text },
          ]}
        />
      </FilterGroup>
      <FilterGroup label={dict.prefs.control} sub="Controls">
        <Segmented
          pref="control"
          label={dict.prefs.control}
          value={prefs.control}
          onChange={(control) => update({ control })}
          options={[
            { value: "classic", label: dict.prefs.classic },
            { value: "modern", label: dict.prefs.modern },
          ]}
        />
      </FilterGroup>
    </div>
  );
}
