"use client";



import Link from "next/link";

import { ORDERS } from "@/lib/mock-data";
import type { Order } from "@/types";

const statusLabel: Record<Order["status"], string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};
const statusClass: Record<Order["status"], string> = {
  pending: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipping: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

// Order detail dialog removed for simplicity

export default function Page() {
  const filteredOrders = ORDERS;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Đơn hàng của tôi</h1>
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="font-medium">Chưa có đơn hàng</p>
          <Link href="/products" className="mt-2 inline-block text-primary hover:underline">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{order.code}</p>
                <span className={statusClass[order.status]}>{statusLabel[order.status]}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>{order.items.length} sản phẩm</p>
                <p>{formatPrice(order.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
