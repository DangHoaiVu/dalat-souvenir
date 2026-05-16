"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gift, Menu, ShoppingCart, User, X } from "lucide-react";
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
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { label: "Sản phẩm", href: "/products" },
  { label: "Câu chuyện", href: "/story" },
  { label: "Giỏ hàng", href: "/cart" },
];

const giftSetUrl = "/products?category=qua-tang";
const brandName = "Đà Lạt Souvenir";

export default function Header() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  const { totalItems, openCart } = useCartStore();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCartClick = () => {
    if (!isInitialized || !isLoggedIn) {
      router.push("/login");
      return;
    }

    openCart();
  };

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        isScrolled
          ? "border-[var(--color-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-sm)] backdrop-blur-xl"
          : "border-transparent bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur-md",
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-text-primary)]"
      >
        Bỏ qua đến nội dung chính
      </a>

      <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger
              className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-muted)] md:hidden"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(86vw,340px)] border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text-primary)]">
              <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
              <div className="flex h-full flex-col px-5 py-6">
                <div className="mb-8 flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Logo Đà Lạt Souvenir" width={44} height={44} className="size-11 object-contain" />
                    <span className="text-base font-semibold tracking-normal text-[var(--color-text-primary)]">{brandName}</span>
                  </Link>
                  <SheetClose className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--color-border)]" aria-label="Đóng menu">
                    <X className="size-5" aria-hidden="true" />
                  </SheetClose>
                </div>

                <nav className="flex flex-col gap-2" aria-label="Điều hướng di động">
                  {navLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Link
                        href={link.href}
                        className="flex min-h-12 items-center rounded-xl px-4 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <SheetClose asChild>
                  <Link
                    href={giftSetUrl}
                    className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-hover)]"
                  >
                    <Gift className="mr-2 size-4" aria-hidden="true" />
                    Xem bộ quà tặng
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-full focus-visible:outline-offset-4">
            <Image src="/logo.png" alt="Logo Đà Lạt Souvenir" width={48} height={48} className="size-11 object-contain md:size-12" />
            <span className="hidden text-[17px] font-semibold tracking-normal text-[var(--color-text-primary)] sm:inline">
              {brandName}
            </span>
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 shadow-[var(--shadow-sm)] md:flex" aria-label="Điều hướng chính">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link min-h-10 rounded-full px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <Link
            href={giftSetUrl}
            className="hidden min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-warm-light)] lg:inline-flex"
          >
            <Gift className="mr-2 size-4" aria-hidden="true" />
            Bộ quà tặng
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={handleCartClick}
            className="relative inline-flex size-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-light)]"
            aria-label="Mở giỏ hàng"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {isInitialized && isLoggedIn && totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1"
              >
                <Badge className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-warm)] px-1.5 text-[10px] font-semibold text-white">
                  {totalItems}
                </Badge>
              </motion.span>
            )}
          </button>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex size-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-transform hover:scale-[1.02]">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-[var(--color-accent-light)] text-sm font-semibold text-[var(--color-accent)]">
                    {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text-primary)] shadow-[var(--shadow-md)]">
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl p-3 font-medium"
                  onClick={() => router.push("/account/profile")}
                >
                  {user?.name && user.name !== user.email ? user.name : user?.email || "Tài khoản"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="mt-1 cursor-pointer rounded-xl p-3 font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => setIsLogoutOpen(true)}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="hidden min-h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-hover)] sm:inline-flex"
            >
              <User className="mr-2 size-4" aria-hidden="true" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <LogoutConfirmDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
    </motion.header>
  );
}
