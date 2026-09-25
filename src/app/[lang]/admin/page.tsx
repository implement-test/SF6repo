import type { Metadata } from "next";
import { PageHeader } from "@/components/headings";
import { AdminConsole } from "@/components/admin/admin-console";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** 관리자 페이지. 메뉴에는 노출하지 않는다. */
export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Admin" title="관리자" />
      <AdminConsole />
    </div>
  );
}
