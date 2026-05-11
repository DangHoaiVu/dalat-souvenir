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
    <header className="sticky top-0 z-40 border-b border-primary-dark/30 bg-primary text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
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
          <span className="text-lg font-black uppercase tracking-tight sm:text-xl">
            Shop Lưu Niệm
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
