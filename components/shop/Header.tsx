"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, Menu, ShieldCheck, ShoppingCart, User, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

const navLinks = [
  { label: "Sản phẩm", href: "/products" },
  { label: "Câu chuyện", href: "/story" },
  { label: "Giỏ hàng", href: "/cart" },
];

const giftSetUrl = "/products?category=qua-tang";
const brandName = "Đà Lạt Souvenir";
const LogoutConfirmDialog = dynamic(() => import("@/components/shop/LogoutConfirmDialog"), {
  ssr: false,
});

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  const { totalItems, openCart } = useCartStore();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const canManage = user?.role === "admin" || user?.role === "seller";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleCartClick = () => {
    if (!isInitialized || !isLoggedIn) {
      router.push("/login");
      return;
    }

    openCart();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-surface/80 backdrop-blur-md transition-all duration-200",
        isScrolled ? "border-[--color-border-strong] shadow-sm" : "border-[--color-border]",
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary"
      >
        Bỏ qua đến nội dung chính
      </a>

      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-offset-4">
          <Image src="/logo.png" alt="Logo Đà Lạt Souvenir" width={56} height={56} className="size-12 rounded-full object-contain md:size-[53px]" />
          <span className="hidden text-base font-bold text-accent sm:inline md:text-lg">
            {brandName}
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Điều hướng chính">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative min-h-10 rounded-md px-3 py-2 text-sm font-medium text-secondary transition-colors duration-150 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform hover:text-accent",
                isActive(link.href) && "text-accent after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Link href={giftSetUrl} className="hidden lg:block">
            <Button size="md">
              <Gift className="size-4" />
              Bộ quà tặng
            </Button>
          </Link>

          <ThemeToggle />

          {canManage && (
            <Link href="/admin/products" className="hidden lg:block">
              <Button size="md" variant="outline">
                <ShieldCheck className="size-4" />
                Quản trị
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={handleCartClick}
            className="relative inline-flex size-10 items-center justify-center rounded-md border border-[--color-border] bg-surface text-primary shadow-sm transition-all duration-150 hover:border-[--color-border-hover] hover:bg-accent-light hover:text-accent"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {isInitialized && isLoggedIn && totalItems > 0 && (
              <Badge className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                {totalItems}
              </Badge>
            )}
          </button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden size-10 items-center justify-center rounded-md border border-[--color-border] bg-surface shadow-sm transition-all hover:border-[--color-border-hover] sm:flex">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-accent-light text-sm font-semibold text-accent">
                    {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg border-[--color-border] bg-surface p-2 text-primary shadow-md">
                {canManage && (
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md p-3 font-medium text-accent"
                    onClick={() => router.push("/admin/products")}
                  >
                    <ShieldCheck className="mr-2 size-4" />
                    Quản trị website
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer rounded-md p-3 font-medium"
                  onClick={() => router.push("/account/profile")}
                >
                  {user?.name && user.name !== user.email ? user.name : user?.email || "Tài khoản"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="mt-1 cursor-pointer rounded-md p-3 font-medium text-error focus:bg-error-light focus:text-error"
                  onClick={() => setIsLogoutOpen(true)}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button size="md" variant="outline">
                <User className="size-4" />
                Đăng nhập
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-md border border-[--color-border] bg-surface text-primary shadow-sm transition hover:bg-surface-muted md:hidden"
            aria-label={isMobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <nav
          className="absolute left-0 right-0 top-full overflow-hidden border-b border-[--color-border] bg-surface shadow-md md:hidden"
          aria-label="Điều hướng di động"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-12 items-center border-b border-[--color-border] px-6 py-3 text-sm font-medium text-secondary transition-colors hover:bg-surface-muted hover:text-accent",
                isActive(link.href) && "text-accent",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link href={giftSetUrl} className="flex min-h-12 items-center px-6 py-3 text-sm font-semibold text-accent">
            <Gift className="mr-2 size-4" />
            Bộ quà tặng
          </Link>
          {canManage && (
            <Link href="/admin/products" className="flex min-h-12 items-center border-t border-[--color-border] px-6 py-3 text-sm font-semibold text-accent">
              <ShieldCheck className="mr-2 size-4" />
              Quản trị website
            </Link>
          )}
        </nav>
      )}

      {isLogoutOpen && <LogoutConfirmDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />}
    </header>
  );
}
