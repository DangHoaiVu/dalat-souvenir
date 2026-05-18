"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, MapPin, Package } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Hồ sơ", href: "/account/profile", icon: Home },
  { id: "orders", label: "Đơn hàng", href: "/account/orders", icon: Package },
  { id: "addresses", label: "Địa chỉ", href: "/account/addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", href: "/account/wishlist", icon: Heart },
];

export default function AccountNav({ mode = "both" }: { mode?: "desktop" | "mobile" | "both" }) {
  const pathname = usePathname();

  return (
    <>
      {(mode === "desktop" || mode === "both") && (
      <aside className="hidden w-64 shrink-0 lg:block">
        <nav className="sticky top-24 rounded-lg border border-[--color-border] bg-surface p-3 shadow-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "mb-1 flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                  active ? "bg-accent-light text-accent" : "text-secondary hover:bg-surface-muted hover:text-primary",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      )}

      {(mode === "mobile" || mode === "both") && (
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[--color-border] pb-1 [-webkit-overflow-scrolling:touch] lg:hidden">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                active ? "border-accent text-accent" : "border-transparent text-secondary hover:text-primary",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      )}
    </>
  );
}
