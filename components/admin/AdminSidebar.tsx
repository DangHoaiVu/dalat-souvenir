"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Package,
  ShoppingCart,
  Tag,
  UserRound,
} from "lucide-react";

import LogoutConfirmDialog from "@/components/shop/LogoutConfirmDialog";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

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
    <aside className="flex h-full w-full flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <div className="border-b border-[var(--color-border)] px-5 py-5">
        <p className="text-lg font-semibold tracking-normal">Shop Lưu Niệm</p>
        <p className="text-xs text-[var(--color-text-tertiary)]">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {item.label}
              </span>
              {item.href === "/admin/orders" && pendingOrders > 0 && (
                <Badge className="bg-[var(--color-warm)] text-white">{pendingOrders}</Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-[var(--color-border)] p-3">
        <ThemeToggle />
        <LogoutConfirmDialog>
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </LogoutConfirmDialog>
      </div>
    </aside>
  );
}
