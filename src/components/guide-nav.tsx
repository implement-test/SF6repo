"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const TABS = [
  { id: "system", href: "/guide" },
  { id: "practice", href: "/guide/practice" },
  { id: "videos", href: "/guide/videos" },
] as const;

/** 공통 공략의 탭 (시스템 글 / 추천 연습 / 추천 영상). 캐릭터 탭과 같은 모양 */
export function GuideNav({ labels }: { labels: Dictionary["guide"]["tabs"] }) {
  const pathname = usePathname();
  return (
    <nav className="overflow-x-auto py-2 [scrollbar-width:none]">
      <ul className="flex min-w-max gap-1.5 px-1.5">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <Link
              href={tab.href}
              aria-current={pathname.replace(/^\/(ko|en|ja)(?=\/)/, "").replace(/\/$/, "") === tab.href ? "page" : undefined}
              className="skew block px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg"
            >
              <span>{labels[tab.id]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
