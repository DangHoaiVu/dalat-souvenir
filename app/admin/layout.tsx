import dynamic from "next/dynamic";
import type { Metadata } from "next";

import AdminGuard from "@/components/admin/AdminGuard";

const AdminSidebar = dynamic(() => import("@/components/admin/AdminSidebar"), {
  loading: () => <div className="h-full w-full animate-pulse bg-muted/20" />,
  ssr: false,
});

export const metadata: Metadata = {
  title: {
    default: "Admin Shop Lưu Niệm Đà Lạt",
    template: "%s | Admin Shop Lưu Niệm Đà Lạt",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[var(--color-border)] bg-[var(--glass-bg)] px-5 shadow-[var(--shadow-sm)] backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">Dashboard</p>
              <h1 className="text-base font-semibold tracking-normal">Quản trị cửa hàng</h1>
            </div>
          </header>
          <main className="p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
