"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gift, Menu, ShoppingCart, User } from "lucide-react";
import { motion } from "framer-motion";

import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LogoutConfirmDialog from "@/components/shop/LogoutConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const navLinks = [
  { label: "Sản phẩm", href: "/products" },
  { label: "Câu chuyện", href: "/story" },
  { label: "Giỏ hàng", href: "/cart" },
];

const giftSetUrl = "/products?category=qua-tang";
const brandName = "Shop Lưu Niệm";

export default function Header() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const { totalItems, openCart } = useCartStore();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-4 z-50 mx-auto w-[calc(100%-32px)] max-w-7xl rounded-full border border-border/40 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-lg ring-1 ring-white/20 dark:ring-white/10"
    >
      <div className="flex h-16 md:h-[64px] items-center justify-between px-4 md:px-6">
        
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-full md:hidden hover:bg-white/50 transition-colors"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-5 text-foreground" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-white/80 backdrop-blur-2xl border-white/40">
              <SheetTitle className="sr-only">Menu Điều Hướng</SheetTitle>
              <nav className="mt-8 flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-3 outline-none mb-6">
                  <img src="/logo.png" alt="Shop Lưu Niệm Đà Lạt Logo" className="size-10 object-contain drop-shadow-sm" />
                  <span className="text-[20px] font-serif font-bold tracking-tight text-primary">{brandName}</span>
                </Link>
                <a
                  href={giftSetUrl}
                  className="mb-4 inline-flex items-center justify-center rounded-2xl bg-white/60 border border-white/50 px-4 py-3 text-sm font-semibold text-primary hover:bg-white/80 shadow-sm transition-all"
                >
                  <Gift className="mr-2 size-4" />
                  Xem bộ quà tặng
                </a>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-foreground/80 hover:bg-white/60 hover:text-primary transition-colors shadow-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-3 outline-none transition-transform hover:scale-[1.02] active:scale-95">
            <img src="/logo.png" alt="Shop Lưu Niệm Đà Lạt Logo" className="size-10 md:size-12 object-contain drop-shadow-sm" />
            <span className="text-[18px] md:text-[24px] font-serif font-bold tracking-tight text-primary whitespace-nowrap">{brandName}</span>
          </Link>
        </div>

        {/* Middle: Desktop Navigation */}
        <nav className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-5 py-2.5 text-[14px] font-semibold text-foreground/80 transition-all duration-200 rounded-full hover:bg-white/50 dark:hover:bg-white/10 hover:text-primary hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={giftSetUrl}
            className="hidden lg:inline-flex items-center rounded-full bg-white/50 dark:bg-white/10 border border-border/40 px-4 py-2 text-[13px] font-bold text-primary transition hover:bg-white/80 dark:hover:bg-white/20 hover:shadow-sm"
          >
            <Gift className="mr-2 size-4" />
            Bộ quà tặng
          </a>

          <div className="h-6 w-px bg-foreground/10 hidden lg:block mx-1"></div>

          <ThemeToggle />

          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex size-10 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-white/60 dark:hover:bg-white/10 hover:text-primary hover:shadow-sm active:scale-95 bg-white/30 dark:bg-white/5 border border-border/40"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="size-5" />
            {totalItems > 0 && (
              <motion.div
                key={totalItems}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1"
              >
                <Badge className="h-5 min-w-[20px] rounded-full bg-secondary px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white flex items-center justify-center">
                  {totalItems}
                </Badge>
              </motion.div>
            )}
          </button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary shadow-sm border border-border/50 bg-white/40 dark:bg-white/10 flex items-center justify-center">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-transparent text-primary font-bold text-sm">
                    {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
                <DropdownMenuItem 
                  className="rounded-xl p-3 cursor-pointer font-semibold"
                  onClick={() => router.push("/account/profile")}
                > 
                  {user?.name && user.name !== user.email ? user.name : user?.email || "Tài khoản"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer rounded-xl p-3 font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive mt-1"
                  onClick={() => setIsLogoutOpen(true)}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-full px-5 py-2 text-[14px] font-bold shadow-md hover:shadow-lg transition-all bg-primary text-white hover:bg-primary/90"
            >
              <User className="mr-2 size-4" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <LogoutConfirmDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
    </motion.header>
  );
}
