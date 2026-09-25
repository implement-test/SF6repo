import type { ReactNode } from "react";

/** 관리 페이지의 섹션 제목 */
export function AdminSection({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end gap-3 border-b border-border pb-2">
        <span aria-hidden className="skew mb-1 inline-block h-4 w-1.5 bg-accent" />
        <h2 className="display text-2xl">{title}</h2>
        <span className="eyebrow pb-0.5">{eyebrow}</span>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}
