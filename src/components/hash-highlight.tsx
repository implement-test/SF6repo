"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 주소의 #setup-12, #combo-3 같은 항목으로 스크롤하고 잠깐 강조한다.
 * (페이지 이동은 pushState 라서 CSS :target 이 동작하지 않는다)
 */
export function HashHighlight() {
  const pathname = usePathname();

  useEffect(() => {
    function apply() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      document.querySelectorAll("[data-highlight]").forEach((e) => e.removeAttribute("data-highlight"));
      el.setAttribute("data-highlight", "");
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    // 목록이 그려진 뒤에 찾는다
    const timer = window.setTimeout(apply, 50);
    window.addEventListener("hashchange", apply);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", apply);
    };
  }, [pathname]);

  return null;
}
