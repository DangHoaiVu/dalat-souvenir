import Link from "next/link";
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";

const productLinks = [
  { label: "Móc khóa", href: "/products?category=moc-khoa" },
  { label: "Postcard", href: "/products?category=postcard" },
  { label: "Túi vải", href: "/products?category=tui-vai" },
  { label: "Đồ len", href: "/products?category=do-len" },
  { label: "Bộ quà tặng", href: "/products?category=qua-tang" },
];

const supportLinks = [
  { label: "Chính sách vận chuyển", href: "#" },
  { label: "Đổi trả & hoàn tiền", href: "#" },
  { label: "Câu hỏi thường gặp", href: "#" },
  { label: "Liên hệ", href: "#contact" },
];

export default function Footer() {
  return (
    <footer id="footer" className="relative mt-16 text-white/90 overflow-hidden">
      <div className="absolute inset-0 bg-[#1B2A1E]/80 backdrop-blur-2xl z-0" />
      <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-secondary/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />
      
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 lg:px-8 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/logo.png" alt="Shop Lưu Niệm Đà Lạt Logo" className="h-12 w-auto brightness-0 invert opacity-90 drop-shadow-md" />
            <span className="text-2xl font-serif font-bold tracking-tight text-white drop-shadow-sm">Shop Lưu Niệm</span>
          </Link>
          <p className="text-sm leading-relaxed text-white/80 max-w-xs font-serif italic drop-shadow-sm">
            "Mang một chút sương mù và sự bình yên của Đà Lạt về tận ngôi nhà của bạn qua từng món quà nhỏ."
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link href="#" className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all text-white" aria-label="Facebook">
              <Facebook className="size-4" />
            </Link>
            <Link href="#" className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all text-white" aria-label="Instagram">
              <Instagram className="size-4" />
            </Link>
            <Link href="#" className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all text-white" aria-label="Youtube">
              <Youtube className="size-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-serif font-bold text-white tracking-wider uppercase text-sm mb-6 drop-shadow-sm">Sản phẩm</h4>
          <ul className="space-y-4 text-sm">
            {productLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-white transition-colors inline-flex items-center gap-2 group text-white/70">
                  <span className="h-px w-0 bg-white transition-all group-hover:w-3 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-serif font-bold text-white tracking-wider uppercase text-sm mb-6 drop-shadow-sm">Hỗ trợ</h4>
          <ul className="space-y-4 text-sm">
            {supportLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-white transition-colors inline-flex items-center gap-2 group text-white/70">
                  <span className="h-px w-0 bg-white transition-all group-hover:w-3 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h4 className="font-serif font-bold text-white tracking-wider uppercase text-sm mb-6 drop-shadow-sm">Liên hệ</h4>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <MapPin className="size-4 shrink-0 text-white" />
              </div>
              <span className="pt-1">123 Phố Núi, Phường 1, Thành phố Đà Lạt, Lâm Đồng</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Phone className="size-4 shrink-0 text-white" />
              </div>
              <span>Hotline: 0900 000 000</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Mail className="size-4 shrink-0 text-white" />
              </div>
              <span>hello@shopluuniem.vn</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Clock className="size-4 shrink-0 text-white" />
              </div>
              <span>Giờ mở cửa: 8:00 - 22:00</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="relative z-10 border-t border-white/10 mx-6 lg:mx-8">
        <div className="mx-auto max-w-7xl py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50 font-medium">
          <p>© {new Date().getFullYear()} Shop Lưu Niệm Đà Lạt. Cảm ơn bạn đã ghé thăm.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Điều khoản</Link>
            <Link href="#" className="hover:text-white transition-colors">Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
