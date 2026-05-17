"use client";
import Image from "next/image";
import { ExternalLink, MapPin, Phone, Package } from "lucide-react";

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

  const isStartDeliveryDisabled =
    isUpdating || order.status === "shipping" || order.status === "delivered" || order.status === "cancelled";

  const startDeliveryLabel =
    order.status === "shipping"
      ? "ĐANG GIAO"
      : order.status === "delivered"
        ? "ĐÃ GIAO"
        : order.status === "cancelled"
          ? "ĐƠN ĐÃ HỦY"
          : "BẮT ĐẦU GIAO HÀNG";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px]">
        <SheetHeader className="px-6 pb-4 border-b border-border/50">
          <SheetTitle className="text-xl font-black tracking-tight">ĐƠN HÀNG {order.code}</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-8 text-sm custom-scrollbar pb-10 px-6">
          {/* Customer info & Address Card */}
          <div className="rounded-[2rem] border bg-accent/20 dark:bg-zinc-950/40 p-6 shadow-xl backdrop-blur-md border-border dark:border-white/5 space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                {order.shippingAddress.name}
              </h3>
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Phone className="size-4" />
                <a href={`tel:${order.shippingAddress.phone}`} className="hover:underline">
                  {order.shippingAddress.phone}
                </a>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {order.shippingAddress.address}
                  </p>
                  
                  {/* Google Maps Link - Using exact coordinates from profile for pinpoint accuracy */}
                  <a 
                    href={order.shippingAddress.latitude && order.shippingAddress.longitude 
                      ? `https://maps.google.com/?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&ll=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&z=18`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress.address)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
                  >
                    Xem trên Maps <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center gap-3 py-6 bg-accent/10 dark:bg-white/5 rounded-[1.5rem] border border-border dark:border-white/5 transition-colors">
                <div className="relative group/qr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      order.shippingAddress.latitude && order.shippingAddress.longitude 
                        ? `https://maps.google.com/?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&ll=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&z=18`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress.address)}`
                    )}`}
                    alt="QR Code địa chỉ"
                    className="size-60 rounded-[1.5rem] bg-white p-3 shadow-lg transition-transform group-hover/qr:scale-105"
                  />
                </div>
                <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Quét để dẫn đường</span>
              </div>
            </div>
          </div>

          {/* Order Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h4 className="font-bold text-zinc-400 uppercase text-[11px] tracking-widest flex items-center gap-2">
                <Package className="size-3" /> Chi tiết đơn hàng
              </h4>
              <span className="text-zinc-500 text-xs font-medium">{order.items.length} món</span>
            </div>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {order.items.map((item) => (
                <div key={item.id} className="group flex items-center gap-4 rounded-[1.5rem] border border-border dark:border-white/5 bg-accent/20 dark:bg-zinc-900/50 p-3 transition-all hover:bg-accent/30 dark:hover:bg-zinc-900 hover:border-border dark:hover:border-white/10">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800 border border-border/50 dark:border-white/5">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="size-6 text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate leading-tight mb-0.5">
                      {item.product.name}
                    </p>
                    <p className="text-[13px] text-muted-foreground font-medium">
                      x{item.quantity} • {item.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-foreground text-base">
                      {item.subtotal.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="flex items-center justify-between px-6 py-5 rounded-[1.5rem] bg-primary/10 border border-primary/20 mt-4 shadow-sm">
              <span className="font-black text-primary uppercase text-xs tracking-[0.15em]">Tổng cộng</span>
              <span className="text-2xl font-black text-foreground">
                {order.total.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Admin Controls */}
          <div className="rounded-[2.25rem] border border-border dark:border-white/5 bg-accent/30 dark:bg-zinc-900/30 p-6 space-y-6 shadow-sm">
            <Button
              className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-black text-base rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-2 tracking-wide uppercase"
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
              {isUpdating ? "ĐANG CẬP NHẬT..." : startDeliveryLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
