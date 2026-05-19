import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";

const quickLinks = [
  { label: "Sản phẩm", href: "/products" },
  { label: "Bộ quà tặng", href: "/products?category=qua-tang" },
  { label: "Câu chuyện", href: "/story" },
  { label: "Giỏ hàng", href: "/cart" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: Facebook, className: "border-[#1877F2]/30 bg-[#1877F2] text-white hover:bg-[#166FE5]" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/lovehoaivulover/",
    icon: Instagram,
    className: "border-pink-400/30 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:brightness-110",
  },
  { label: "Youtube", href: "#", icon: Youtube, className: "border-[#FF0000]/30 bg-[#FF0000] text-white hover:bg-[#E60000]" },
];

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
      <div className="mx-auto grid max-w-[1680px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1fr] lg:px-10 2xl:px-12">
        <div>
          <Link href="/" className="inline-flex min-h-11 items-center gap-3">
            <Image src="/logo.png" alt="Logo Đà Lạt Souvenir" width={48} height={48} className="size-12 rounded-full object-contain" loading="lazy" />
            <span className="text-lg font-semibold tracking-normal text-[var(--color-text-primary)]">Đà Lạt Souvenir</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7">
            Đặc sản, quà lưu niệm và sản phẩm thủ công được tuyển chọn từ Đà Lạt, đóng gói chỉn chu để làm quà hoặc dùng hằng ngày.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon, className }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`inline-flex size-11 items-center justify-center rounded-full border shadow-sm transition duration-150 ease-in-out hover:-translate-y-px hover:shadow-md ${className}`}
                aria-label={label}
              >
                <Icon className="size-4" strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
            Liên kết nhanh
          </h2>
          <ul className="mt-5 space-y-2 text-sm">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-10 items-center rounded-lg px-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
            Liên hệ
          </h2>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="grid min-h-10 grid-cols-[16px_minmax(0,1fr)] items-center gap-3">
              <MapPin className="size-4 text-[var(--color-warm)]" aria-hidden="true" />
              <span>Thành phố Qui Nhơn, Bình Định</span>
            </li>
            <li className="grid min-h-10 grid-cols-[16px_minmax(0,1fr)] items-center gap-3">
              <Phone className="size-4 text-[var(--color-warm)]" aria-hidden="true" />
              <span>0979.777.777</span>
            </li>
            <li className="grid min-h-10 grid-cols-[16px_minmax(0,1fr)] items-center gap-3">
              <Mail className="size-4 text-[var(--color-warm)]" aria-hidden="true" />
              <span>danghoaivu2004@gmail.com</span>
            </li>
            <li className="grid min-h-10 grid-cols-[16px_minmax(0,1fr)] items-center gap-3">
              <Instagram className="size-4 text-[var(--color-warm)]" aria-hidden="true" />
              <Link
                href="https://www.instagram.com/lovehoaivulover/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                @lovehoaivulover
              </Link>
            </li>
            <li className="grid min-h-10 grid-cols-[16px_minmax(0,1fr)] items-center gap-3">
              <Clock className="size-4 text-[var(--color-warm)]" aria-hidden="true" />
              <span>8:00 - 22:00 mỗi ngày</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-3 px-4 py-5 text-xs sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10 2xl:px-12">
          <p>© {new Date().getFullYear()} Đà Lạt Souvenir. Cảm ơn bạn đã ghé thăm.</p>
          <div className="flex gap-4">
            <Link href="#" className="min-h-10 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
              Điều khoản
            </Link>
            <Link href="#" className="min-h-10 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
              Bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
