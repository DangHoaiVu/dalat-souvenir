"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Tag,
  LogOut,
  UserRound,
} from "lucide-react";
import LogoutConfirmDialog from "@/components/shop/LogoutConfirmDialog";

import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: Tag },
  { href: "/admin/profile", label: "Hồ sơ", icon: UserRound },
];

export default function AdminSidebar() {
  const pathname = usePathname();
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void fetchPendingOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchPendingOrders]);

  return (
    <aside className="flex h-full w-full flex-col bg-[#0F1115] text-white shadow-xl">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-xl font-bold">Shop Lưu Niệm</p>
        <p className="text-xs text-white/60">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                active ? "bg-primary text-white" : "text-white/90 hover:bg-primary/80"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {item.label}
              </span>
              {item.href === "/admin/orders" && pendingOrders > 0 && (
                <Badge className="bg-red-500 text-white">{pendingOrders}</Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        <div className="flex justify-between px-3">         
          <ThemeToggle />
        </div>
        <LogoutConfirmDialog>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </LogoutConfirmDialog>
      </div>
    </aside>
  );
}
