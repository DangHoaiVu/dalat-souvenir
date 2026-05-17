import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Câu chuyện", href: "/story" },
  { label: "Tài khoản", href: "/account/profile" },
];

export default function SimpleHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-sm)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-10 2xl:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/logo.png"
            alt="Shop Lưu Niệm Đà Lạt Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
          <span className="text-base font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-lg">
            Shop Lưu Niệm
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-10 rounded-full px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
