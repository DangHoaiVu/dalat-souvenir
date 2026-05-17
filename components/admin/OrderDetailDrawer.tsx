"use client";

import Image from "next/image";
import { ExternalLink, MapPin, Package, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Order } from "@/types";

interface OrderDetailDrawerProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: number | string, status: Order["status"]) => Promise<void>;
  isUpdating?: boolean;
}

export default function OrderDetailDrawer({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  isUpdating = false,
}: OrderDetailDrawerProps) {
  if (!order) return null;

  const mapsUrl =
    order.shippingAddress.latitude && order.shippingAddress.longitude
      ? `https://maps.google.com/?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&ll=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&z=18`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress.address)}`;

  const isStartDeliveryDisabled =
    isUpdating || order.status === "shipping" || order.status === "delivered" || order.status === "cancelled";

  const startDeliveryLabel =
    order.status === "shipping"
      ? "Đang giao"
      : order.status === "delivered"
        ? "Đã giao"
        : order.status === "cancelled"
          ? "Đơn đã hủy"
          : "Bắt đầu giao hàng";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full !max-w-none sm:!w-[760px] xl:!w-[900px]">
        <SheetHeader className="shrink-0 border-b border-border/50 px-5 py-4 sm:px-6">
          <SheetTitle className="text-xl font-black tracking-tight">Đơn hàng {order.code}</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-sm custom-scrollbar sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-border bg-accent/15 p-5 shadow-card">
                <h3 className="text-xl font-black tracking-tight text-foreground">{order.shippingAddress.name}</h3>
                <a
                  href={`tel:${order.shippingAddress.phone}`}
                  className="mt-2 inline-flex items-center gap-2 text-base font-bold text-primary hover:underline"
                >
                  <Phone className="size-4" />
                  {order.shippingAddress.phone}
                </a>

                <div className="mt-4 flex gap-3 border-t border-border/60 pt-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium leading-6 text-muted-foreground">
                      {order.shippingAddress.address || "Chưa có địa chỉ"}
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                    >
                      Xem trên Maps <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-border bg-accent/10 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mapsUrl)}`}
                  alt="QR Code địa chỉ"
                  className="size-32 shrink-0 rounded-xl bg-white p-2 shadow-sm sm:size-36"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Quét để dẫn đường
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    QR nhỏ gọn để mở Google Maps nhanh khi chuẩn bị giao hàng.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Package className="size-3" />
                  Chi tiết đơn hàng
                </h4>
                <span className="text-xs font-medium text-muted-foreground">{order.items.length} món</span>
              </div>

              <div className="max-h-[330px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-accent/15 p-3 transition-colors hover:bg-accent/25"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <Package className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold leading-tight text-foreground">{item.product.name}</p>
                      <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                        x{item.quantity} · {item.price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-black text-foreground">
                      {item.subtotal.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 shadow-sm">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-primary">Tổng cộng</span>
                <span className="text-2xl font-black text-foreground">
                  {order.total.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-accent/20 p-4 shadow-sm">
                <Button
                  className="h-12 w-full rounded-xl bg-primary text-sm font-black uppercase tracking-wide text-white shadow-primary/20 hover:bg-primary/90"
                  onClick={async () => {
                    try {
                      await onUpdateStatus(order.id, "shipping");
                      onOpenChange(false);
                    } catch {
                      // Error is handled by parent page.
                    }
                  }}
                  disabled={isStartDeliveryDisabled}
                >
                  {isUpdating ? "Đang cập nhật..." : startDeliveryLabel}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
