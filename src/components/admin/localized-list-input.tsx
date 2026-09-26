"use client";

import type { Localized } from "@/lib/types";
import { inputClass } from "./starters-input";

const LANGS = [
  { key: "ko", placeholder: "한국어" },
  { key: "en", placeholder: "English (선택)" },
  { key: "ja", placeholder: "日本語 (선택)" },
] as const;

/** 한 줄씩 적는 다국어 목록 (장점 / 단점 / 클래식·모던 차이). 추가 · 삭제 · 순서 변경 */
export function LocalizedListInput({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: Partial<Localized>[];
  onChange: (v: Partial<Localized>[]) => void;
}) {
  const update = (i: number, patch: Partial<Localized>) =>
    onChange(value.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const iconButton =
    "grid size-7 place-items-center border border-border-strong text-sm text-muted hover:text-fg disabled:opacity-30";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {value.length === 0 && (
        <p className="border border-dashed border-border px-3 py-2 text-xs text-muted">아직 없습니다.</p>
      )}
      <ol className="flex flex-col gap-2">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2 border border-border bg-surface-2 p-2">
            <span className="display w-5 pt-1.5 text-right text-muted">{i + 1}</span>
            <div className="grid min-w-0 flex-1 gap-1.5">
              {LANGS.map((lang) => (
                <input
                  key={lang.key}
                  value={item[lang.key] ?? ""}
                  onChange={(e) => update(i, { [lang.key]: e.target.value })}
                  placeholder={lang.placeholder}
                  aria-label={`${label} ${i + 1} ${lang.key}`}
                  className={inputClass}
                />
              ))}
            </div>
            <span className="flex flex-col gap-1">
              <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로">
                ↑
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                aria-label="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                className={`${iconButton} hover:border-warn hover:text-warn`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label="삭제"
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...value, { ko: "" }])}
        className="self-start border border-dashed border-border-strong px-3 py-1.5 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
      >
        + 한 줄 추가
      </button>
      {help && <span className="text-xs text-muted">{help}</span>}
    </div>
  );
}

/** 저장 전 정리: 빈 줄은 버리고, 한국어 없이 다른 언어만 있으면 오류 */
export function cleanLocalizedList(list: Partial<Localized>[] | null | undefined): Localized[] | "missing-ko" {
  const out: Localized[] = [];
  for (const item of list ?? []) {
    const cleaned: Partial<Localized> = {};
    for (const { key } of LANGS) {
      const text = item[key]?.trim();
      if (text) cleaned[key] = text;
    }
    if (Object.keys(cleaned).length === 0) continue;
    if (!cleaned.ko) return "missing-ko";
    out.push(cleaned as Localized);
  }
  return out;
}
