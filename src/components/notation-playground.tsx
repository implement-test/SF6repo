"use client";

import { useState } from "react";
import { findUnknownTokens, parseNotation } from "@/lib/notation/parse";
import { NotationImage, NotationText } from "./notation";

export function NotationPlayground({ initial, unknownLabel }: { initial: string; unknownLabel: string }) {
  const [value, setValue] = useState(initial);
  const unknown = findUnknownTokens(parseNotation(value));

  return (
    <div className="border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="eyebrow shrink-0">Input</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          className="w-full border-b-2 border-border-strong bg-transparent py-1 font-mono text-lg outline-none focus:border-accent"
        />
      </div>
      <div className="flex min-h-20 items-center border-l-2 border-accent bg-inset px-4 py-4">
        <NotationImage notation={value} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-muted">
        <span className="eyebrow">Text</span>
        <NotationText notation={value} />
      </div>
      {unknown.length > 0 && (
        <p className="border-t border-warn/40 bg-warn/10 px-4 py-2 text-sm text-warn">
          {unknownLabel}: {unknown.join(", ")}
        </p>
      )}
    </div>
  );
}
