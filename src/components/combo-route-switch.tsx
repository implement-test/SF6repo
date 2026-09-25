"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * 루트가 여러 개인 콤보: 루트에 마우스를 올리면(휴대폰은 누르면) 오른쪽 수치가 그 루트로 바뀐다.
 * 기본은 첫 번째 루트이고, 마지막에 고른 루트를 유지한다. 카드 내용은 서버에서 그리고, 어떤 루트를 보일지만 여기서 정한다.
 */
const RouteContext = createContext<{ active: number; setActive: (i: number) => void }>({
  active: 0,
  setActive: () => {},
});

export function RouteScope({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  return <RouteContext.Provider value={{ active, setActive }}>{children}</RouteContext.Provider>;
}

/** 루트 목록. 마우스가 목록을 벗어나도 마지막에 올렸던 루트를 그대로 보여 준다 */
export function RouteList({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={className}>{children}</ol>;
}

export function RouteRow({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  const { active, setActive } = useContext(RouteContext);
  return (
    <li
      data-active={active === index}
      onMouseEnter={() => setActive(index)}
      onClick={() => setActive(index)}
      className={className}
    >
      {children}
    </li>
  );
}

/** 루트별로 미리 그려 둔 수치 중 지금 루트의 것만 보인다 */
export function RoutePanels({ panels }: { panels: ReactNode[] }) {
  const { active } = useContext(RouteContext);
  // 패널이 비어 있을 수도 있다 (메모 없는 루트)
  return <>{active < panels.length ? panels[active] : panels[0]}</>;
}
