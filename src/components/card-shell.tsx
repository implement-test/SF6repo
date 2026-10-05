import type { ReactNode } from "react";
import type { TargetLevel } from "@/lib/types";

/**
 * 접히는 카드(콤보 · 셋업 · 추천 연습). 기본은 제목 줄만 보이고 누르면 펼친다.
 * <details> 라서 스크립트 없이 열고 닫히며, 주소의 #아이디 로 들어오면 CardHashOpener 가 펼친다.
 * 즐겨찾기 · 퍼가기 · 수정 버튼(actions)은 제목 줄 오른쪽 위에 따로 올려서, 눌러도 카드가 접히거나 펼쳐지지 않는다.
 */
export function CardShell({
  id,
  level,
  dataLevel,
  open = false,
  header,
  actions,
  children,
}: {
  id: string;
  level: TargetLevel;
  /** 방문자의 대상 수준 숨김에 쓰는 값 (퍼간 화면에서는 비운다) */
  dataLevel?: TargetLevel;
  /** 퍼간 화면처럼 처음부터 펼쳐 둘 때 */
  open?: boolean;
  header: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      data-level={dataLevel}
      className="group relative scroll-mt-40 border border-border bg-surface transition-colors hover:border-border-strong"
    >
      {/* 대상 수준 색 띠 */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--lv-${level})` }} />
      <details className="card-details" open={open || undefined} data-card="">
        <summary className={`flex cursor-pointer flex-wrap items-center gap-2 py-3 pl-5 select-none ${actions ? "pr-32" : "pr-4"}`}>
          <span aria-hidden className="card-chevron text-xs text-muted">
            ▼
          </span>
          {header}
        </summary>
        <div className="border-t border-border">{children}</div>
      </details>
      {actions && <span className="absolute right-3 top-2.5 flex items-center gap-1.5">{actions}</span>}
    </article>
  );
}
