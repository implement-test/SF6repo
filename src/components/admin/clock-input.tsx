"use client";

import { useState } from "react";
import { formatClock, parseClock } from "@/lib/youtube";
import { inputClass } from "./starters-input";

/**
 * 영상 시각 입력: "1:23" 또는 "83"(초)으로 적고 초로 저장한다.
 * 입력 중("1:")에도 글자가 지워지지 않도록 입력한 글자를 따로 들고 있는다.
 */
export function ClockInput({
  value,
  onChange,
  placeholder = "예: 1:23",
  className = "",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(value === null ? "" : formatClock(value));
  const parsed = parseClock(text);
  const invalid = text.trim() !== "" && parsed === null;

  return (
    <div className="flex flex-col gap-1">
      <input
        value={text}
        inputMode="numeric"
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          const v = parseClock(e.target.value);
          if (e.target.value.trim() === "") onChange(null);
          else if (v !== null) onChange(v);
        }}
        onBlur={() => parsed !== null && setText(formatClock(parsed))}
        className={`${inputClass} tabular-nums ${invalid ? "border-warn!" : ""} ${className}`}
      />
      {invalid && <span className="text-xs text-warn">분:초(1:23) 또는 초(83)로 적어 주세요.</span>}
    </div>
  );
}
