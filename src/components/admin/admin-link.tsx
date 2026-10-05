"use client";

import Link from "next/link";
import { useAdmin } from "./admin-context";

/** 헤더의 관리자 페이지 바로가기. 관리자로 로그인했을 때만 보인다 (처음 로그인은 /admin 주소로) */
export function AdminLink() {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return (
    <Link
      href="/admin"
      className="skew border border-accent px-2.5 py-0.5 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-accent-fg"
    >
      <span>관리자</span>
    </Link>
  );
}
