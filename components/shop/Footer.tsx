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
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/lovehoaivulover/", icon: Instagram },
  { label: "Youtube", href: "#", icon: Youtube },
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
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-light)]"
                aria-label={label}
              >
                <Icon className="size-4" aria-hidden="true" />
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
            <li className="flex gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-[var(--color-warm)]" aria-hidden="true" />
              <span>123 Phố Núi, Phường 1, Thành phố Đà Lạt, Lâm Đồng</span>
            </li>
            <li className="flex min-h-10 items-center gap-3">
              <Phone className="size-4 shrink-0 text-[var(--color-warm)]" aria-hidden="true" />
              <span>0900 000 000</span>
            </li>
            <li className="flex min-h-10 items-center gap-3">
              <Mail className="size-4 shrink-0 text-[var(--color-warm)]" aria-hidden="true" />
              <span>hello@shopluuniem.vn</span>
            </li>
            <li className="flex min-h-10 items-center gap-3">
              <Instagram className="size-4 shrink-0 text-[var(--color-warm)]" aria-hidden="true" />
              <Link
                href="https://www.instagram.com/lovehoaivulover/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                @lovehoaivulover
              </Link>
            </li>
            <li className="flex min-h-10 items-center gap-3">
              <Clock className="size-4 shrink-0 text-[var(--color-warm)]" aria-hidden="true" />
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
