import type { ReactNode } from "react";
import type { TargetLevel } from "@/lib/types";

export function LevelBadge({ level, label }: { level: TargetLevel; label: string }) {
  return (
    <span className="skew px-2 py-0.5 text-xs font-bold" style={{ background: `var(--lv-${level})`, color: "var(--bg)" }}>
      <span>{label}</span>
    </span>
  );
}

/** 콤보 시작 위치 (거리 무관 / 필드 / 코너 …). 대상 수준 배지 옆에 둔다 */
export function PositionBadge({ label }: { label: string }) {
  return (
    // 테두리 대신 안쪽 선(inset ring)이라 크기가 대상 수준 배지와 같다
    <span className="skew px-2 py-0.5 text-xs font-bold text-fg inset-ring inset-ring-fg/70">
      <span>{label}</span>
    </span>
  );
}

export function NotTranslatedBadge({ label }: { label: string }) {
  return (
    <span className="border border-dashed border-border-strong px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
      {label}
    </span>
  );
}

export function OutdatedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-xs font-semibold text-warn">
      <svg viewBox="0 0 16 16" className="size-3" fill="currentColor" aria-hidden>
        <path d="M8 1 15 14H1L8 1Zm-.75 5v4h1.5V6h-1.5Zm0 5v1.5h1.5V11h-1.5Z" />
      </svg>
      {label}
    </span>
  );
}

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={
        tone === "accent"
          ? "border border-accent/50 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent"
          : "border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted"
      }
    >
      {children}
    </span>
  );
}
