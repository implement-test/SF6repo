"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// 즐겨찾기(이 캐릭터의 항목만)는 개요 왼쪽
const SECTIONS = ["favorites", "overview", "moves", "combos", "setups", "practice", "vs", "videos"] as const;

/** SF6 메뉴처럼 기울어진 탭. 선택된 탭은 마젠타로 채운다. */
export function CharacterNav({ slug, labels }: { slug: string; labels: Dictionary["nav"] }) {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto py-2 [scrollbar-width:none]">
      <ul className="flex min-w-max gap-1.5 px-1.5">
        {SECTIONS.map((section) => {
          const href = section === "overview" ? `/${slug}` : `/${slug}/${section}`;
          const active = pathname === href;
          return (
            <li key={section}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="skew block px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-accent aria-[current=page]:text-accent-fg"
              >
                <span>{section === "favorites" ? `☆ ${labels.favorites}` : labels[section]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
