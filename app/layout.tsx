import type { Metadata } from "next";
import localFont from "next/font/local";

import Providers from "@/app/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-serif",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Đà Lạt Souvenir — Đặc sản & Quà tặng Đà Lạt",
    template: "%s | Đà Lạt Souvenir",
  },
  description:
    "Mua đặc sản và quà lưu niệm Đà Lạt: mứt, trà, cà phê, đồ thủ công và hộp quà tuyển chọn. Giao hàng toàn quốc.",
  openGraph: {
    siteName: "Đà Lạt Souvenir",
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
    <html lang="vi" className={cn("font-sans scroll-smooth", geistSans.variable, geistMono.variable)}>
      <body className="custom-scrollbar bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
