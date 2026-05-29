"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Package, ShoppingCart, Tag, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import LogoutConfirmDialog from "@/components/shop/LogoutConfirmDialog";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { href: "/", label: "Xem website", icon: Home },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: Tag },
  { href: "/admin/profile", label: "Hồ sơ", icon: UserRound },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [pendingOrders, setPendingOrders] = useState(0);

  const fetchPendingOrders = useCallback(async () => {
    const { count, error } = await supabase
      .from("orders")
      .select("order_id", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      console.error("[AdminSidebar] Failed to load pending count", error);
      return;
    }

    setPendingOrders(count ?? 0);
  }, []);

  useEffect(() => {
    void fetchPendingOrders();

    const channel = supabase
      .channel("admin-orders-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void fetchPendingOrders();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchPendingOrders]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className="hidden h-screen w-[256px] shrink-0 flex-col overflow-hidden bg-[#0c4a6e] text-white lg:flex">
        <div className="border-b border-sky-700/70 px-5 py-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border border-white/20 bg-white/10">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name || user.email || "Avatar"} referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-sky-700 text-sm font-bold text-white">
                {(user?.name ?? "A").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-normal text-white">Shop Lưu Niệm</p>
              <p className="truncate text-xs text-sky-200">{user?.email || "Admin Panel"}</p>
            </div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-md px-3 text-sm font-medium transition-all duration-150",
                  active ? "bg-sky-700 text-white" : "text-sky-200 hover:bg-sky-800 hover:text-white",
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {item.label}
                </span>
                {item.href === "/admin/orders" && pendingOrders > 0 && (
                  <Badge className="bg-white text-sky-800">{pendingOrders}</Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-sky-700/70 p-3">
          <ThemeToggle />
          <LogoutConfirmDialog>
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-800 hover:text-white"
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </LogoutConfirmDialog>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[--color-border] bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors sm:px-2 sm:text-[11px]",
                active ? "text-accent" : "text-tertiary hover:text-accent",
              )}
            >
              <Icon className="size-5" />
              <span className="max-w-full truncate">{item.label}</span>
              {item.href === "/admin/orders" && pendingOrders > 0 && (
                <span className="absolute right-[28%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white">
                  {pendingOrders}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
