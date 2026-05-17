"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { CheckCircle2, ClipboardCheck, PackageSearch } from "lucide-react";

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
  const orderId = searchParams.get("orderId") ?? "";
  const orderCode = searchParams.get("code") ?? orderId ?? "SLN000000";

  useEffect(() => {
    clearCart();
    if (!orderId) return;

    try {
      const current = JSON.parse(window.localStorage.getItem("shopluuniem-recent-order-ids") || "[]");
      const ids = Array.isArray(current) ? current.filter((id): id is string => typeof id === "string") : [];
      const next = [orderId, ...ids.filter((id) => id !== orderId)].slice(0, 8);
      window.localStorage.setItem("shopluuniem-recent-order-ids", JSON.stringify(next));
    } catch {
      window.localStorage.setItem("shopluuniem-recent-order-ids", JSON.stringify([orderId]));
    }
  }, [clearCart, orderId]);

  const suggested = useMemo(() => PRODUCTS.slice(0, 3), []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-xl items-center p-8 text-center">
        <div className="mb-4 grid size-20 place-items-center rounded-full bg-success-light text-success">
          <CheckCircle2 className="size-12" />
        </div>
        <h1 className="text-3xl font-bold text-primary">Đơn hàng đã đặt thành công</h1>
        <p className="mt-2 text-secondary">
          Cảm ơn bạn đã tin tưởng Shop Lưu Niệm Đà Lạt. Đơn hàng đã được ghi nhận trong hệ thống.
        </p>

        <div className="mt-6 w-full rounded-lg border border-[--color-border] bg-surface-muted p-4 text-left">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-1 size-5 shrink-0 text-success" />
            <div>
              <p className="text-sm text-secondary">Mã đơn hàng</p>
              <p className="text-lg font-semibold text-primary">{orderCode}</p>
              <p className="mt-2 text-sm text-secondary">Dự kiến giao: 2-4 ngày làm việc</p>
              <p className="text-sm text-secondary">Bạn có thể theo dõi trạng thái, cập nhật thông tin hoặc hủy đơn trong lịch sử đơn hàng khi đơn chưa giao.</p>
            </div>
          </div>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-success-light px-4 py-2 text-sm font-semibold text-success-text">
          <CheckCircle2 className="size-4" />
          Xác nhận đơn hàng đã đặt thành công
        </p>

        <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
          <Link href={orderId ? `/account/orders?orderId=${encodeURIComponent(orderId)}` : "/account/orders"}>
            <Button variant="outline" className="w-full">
              <PackageSearch className="mr-2 size-4" />
              Xem lịch sử đơn
            </Button>
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
