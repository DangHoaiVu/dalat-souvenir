"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import { PRODUCTS } from "@/lib/mock-data";
import { useCartStore } from "@/stores/cartStore";

export default function Page() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const orderCode = searchParams.get("code") ?? "SLN000000";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const suggested = useMemo(() => PRODUCTS.slice(0, 3), []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 grid size-24 place-items-center rounded-full bg-light">
          <CheckCircle2 className="size-14 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Đặt hàng thành công! 🎉</h1>
        <p className="mt-2 text-muted-foreground">
          Cảm ơn bạn đã tin tưởng Shop Lưu Niệm Đà Lạt
        </p>

        <div className="mt-5 rounded-xl border p-4 text-left">
          <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
          <p className="text-lg font-semibold">{orderCode}</p>
          <p className="mt-2 text-sm">Dự kiến giao: 2-4 ngày làm việc</p>
          <p className="text-sm">Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút</p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          📧 Email xác nhận đã được gửi đến địa chỉ của bạn
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            href="/account/orders"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-primary text-sm font-medium text-primary hover:bg-primary hover:text-white"
          >
            Xem đơn hàng
          </Link>
          <Link
            href="/products"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-dark"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Bạn có thể thích</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {suggested.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
