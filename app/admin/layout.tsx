import dynamic from "next/dynamic";
import AdminGuard from "@/components/admin/AdminGuard";
import type { Metadata } from "next";

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
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="hidden md:block sticky top-0 h-screen w-[240px] border-r">
          <AdminSidebar />
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-card px-4">
            <h1 className="font-semibold">Admin</h1>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
