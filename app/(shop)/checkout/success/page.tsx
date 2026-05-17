"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRODUCTS } from "@/lib/mock-data";
import { useCartStore } from "@/stores/cartStore";

export default function Page() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-xl items-center p-8 text-center">
        <div className="mb-4 size-20 rounded-full bg-success-light" />
        <div className="h-8 w-72 max-w-full rounded-md bg-surface-muted" />
        <div className="mt-3 h-4 w-80 max-w-full rounded-md bg-surface-muted" />
      </Card>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const orderCode = searchParams.get("code") ?? searchParams.get("orderId") ?? "SLN000000";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const suggested = useMemo(() => PRODUCTS.slice(0, 3), []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-xl items-center p-8 text-center">
        <div className="mb-4 grid size-20 place-items-center rounded-full bg-success-light text-success">
          <CheckCircle2 className="size-12" />
        </div>
        <h1 className="text-3xl font-bold text-primary">Đặt hàng thành công</h1>
        <p className="mt-2 text-secondary">
          Cảm ơn bạn đã tin tưởng Shop Lưu Niệm Đà Lạt.
        </p>

        <div className="mt-6 w-full rounded-lg border border-[--color-border] bg-surface-muted p-4 text-left">
          <p className="text-sm text-secondary">Mã đơn hàng</p>
          <p className="text-lg font-semibold text-primary">{orderCode}</p>
          <p className="mt-2 text-sm text-secondary">Dự kiến giao: 2-4 ngày làm việc</p>
          <p className="text-sm text-secondary">Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.</p>
        </div>
        <p className="mt-3 text-sm text-tertiary">
          Email xác nhận đã được gửi đến địa chỉ của bạn nếu có cung cấp email.
        </p>

        <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
          <Link href="/account/orders">
            <Button variant="outline" className="w-full">Xem đơn hàng</Button>
          </Link>
          <Link href="/products">
            <Button className="w-full">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </Card>

      <section className="mt-12">
        <h2 className="mb-5 text-xl font-semibold text-primary">Bạn có thể thích</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {suggested.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
