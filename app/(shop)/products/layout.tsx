import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tất cả sản phẩm",
  description: "Khám phá đồ lưu niệm, quà tặng và kỷ vật Đà Lạt tại Shop Lưu Niệm Đà Lạt.",
};

export default function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
