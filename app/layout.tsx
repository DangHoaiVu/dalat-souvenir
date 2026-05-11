import type { Metadata } from "next";
import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from "@/app/providers";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: {
    default: "Shop Lưu Niệm Đà Lạt — Quà Tặng & Kỷ Vật Đà Lạt",
    template: "%s | Shop Lưu Niệm Đà Lạt",
  },
  description:
    "Mua đồ lưu niệm Đà Lạt: móc khóa, postcard, túi vải, đồ len và hộp quà kỷ niệm. Giao hàng toàn quốc.",
  openGraph: {
    siteName: "Shop Lưu Niệm Đà Lạt",
    locale: "vi_VN",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans scroll-smooth", inter.variable, plusJakarta.variable)}>
      <body className="antialiased bg-background text-foreground custom-scrollbar font-sans tracking-tight">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
