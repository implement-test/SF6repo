"use client";

import { useState, type ReactNode } from "react";

/** 제목 줄을 눌러 펼치고 접는 영역. 기본은 접힘이고, 펼쳤을 때만 내용을 그린다. */
export function Collapsible({
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
    <div className="border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 bg-surface-2 px-3 py-2 text-left text-sm font-bold text-muted transition-colors hover:text-fg aria-expanded:text-fg"
      >
        <svg
          viewBox="0 0 16 16"
          className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M5 2.5 11 8l-6 5.5z" />
        </svg>
        {open ? hideLabel : showLabel}
      </button>
      {open && <div className="border-t border-border p-3">{children}</div>}
    </div>
  );
}
