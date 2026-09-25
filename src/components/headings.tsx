import type { ReactNode } from "react";

/** 페이지 제목: 작은 영문 라벨 + 굵은 이탤릭 제목 */
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2 border-b border-border pb-5">
      <p className="eyebrow text-accent!">{eyebrow}</p>
      <h1 className="display text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="max-w-2xl text-muted">{children}</div>}
    </header>
  );
}

/** 섹션 제목 */
export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-end gap-3 border-b border-border pb-2">
      <span aria-hidden className="skew mb-1 inline-block h-4 w-1.5 bg-accent" />
      <h2 className="display text-2xl">{title}</h2>
      <span className="eyebrow pb-0.5">{eyebrow}</span>
    </div>
  );
}
