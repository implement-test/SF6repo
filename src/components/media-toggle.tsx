"use client";

import { useState, type ReactNode } from "react";

/**
 * 영상 펼치기/접기. 기본은 접힘이며, 펼쳤을 때만 영상을 DOM 에 넣는다
 * (접혀 있는 동안에는 YouTube 플레이어도, 짧은 영상도 받지 않는다).
 */
export function MediaToggle({
  showLabel,
  hideLabel,
  children,
}: {
  showLabel: string;
  hideLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="skew border border-border-strong px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:border-accent hover:text-accent aria-expanded:border-accent aria-expanded:text-accent"
      >
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden>
            {open ? <path d="M3 10.5 8 5.5l5 5-1 1-4-4-4 4z" /> : <path d="M2 3h12v10H2V3Zm4.5 2.5v5l4-2.5-4-2.5Z" />}
          </svg>
          {open ? hideLabel : showLabel}
        </span>
      </button>
      {open && <div className="w-full">{children}</div>}
    </div>
  );
}
