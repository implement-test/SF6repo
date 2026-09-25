"use client";

import { useEffect, useState } from "react";
import type { ChangeKind } from "@/content/changelog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useAdmin } from "./admin/admin-context";

export type ChangelogView = {
  date: string;
  items: { kind: ChangeKind; text: string; adminOnly: boolean }[];
}[];

const KIND_STYLE: Record<ChangeKind, string> = {
  added: "bg-drive/15 text-drive border-drive/40",
  changed: "bg-highlight/15 text-highlight-text border-highlight/40",
  removed: "bg-accent/10 text-accent border-accent/40",
};

/** "2026-09-25" → "2026.09.25" (연/월/일만) */
function formatDate(date: string) {
  return date.replaceAll("-", ".");
}

/** 헤더의 '업데이트 내역' 버튼과 팝업. 관리자 전용 항목은 관리자에게만 보인다. */
export function ChangelogButton({ entries, labels }: { entries: ChangelogView; labels: Dictionary["changelog"] }) {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const visible = entries
    .map((e) => ({ ...e, items: e.items.filter((i) => isAdmin || !i.adminOnly) }))
    .filter((e) => e.items.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-muted transition-colors hover:text-accent"
      >
        {labels.button}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="relative flex max-h-[85vh] w-full max-w-xl flex-col border border-accent bg-surface shadow-2xl"
          >
            <div className="brand-bar h-[3px]" />
            <header className="flex items-center gap-3 border-b border-border px-5 py-3">
              <span className="eyebrow text-accent!">Updates</span>
              <h2 className="display text-2xl">{labels.title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto text-2xl leading-none text-muted hover:text-fg"
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <ol className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
              {visible.map((entry) => (
                <li key={entry.date} className="relative border-l-2 border-border pb-6 pl-5 last:pb-1">
                  <span aria-hidden className="skew absolute -left-[7px] top-1 size-3 bg-accent" />
                  <p className="display text-xl tabular-nums">{formatDate(entry.date)}</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`mt-px shrink-0 border px-1.5 py-0.5 text-[0.7rem] font-bold ${KIND_STYLE[item.kind]}`}>
                          {labels[item.kind]}
                        </span>
                        <span className="pt-0.5">
                          {item.text}
                          {item.adminOnly && (
                            <span className="ml-1.5 border border-border-strong px-1 py-px text-[0.65rem] font-semibold text-muted">
                              {labels.adminOnly}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
