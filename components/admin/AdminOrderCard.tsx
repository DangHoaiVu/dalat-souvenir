"use client";

import Image from "next/image";
import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Package, 
  Phone, 
  MapPin, 
  Receipt,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

interface AdminOrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  statusLabel: Record<string, string>;
  statusClass: Record<string, string>;
}

export default function AdminOrderCard({ 
  order, 
  onViewDetails, 
  statusLabel, 
  statusClass 
}: AdminOrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

  // Accurate Google Maps link from order coordinates
  const googleMapsLink = order.shippingAddress.latitude && order.shippingAddress.longitude 
    ? `https://maps.google.com/?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&ll=${order.shippingAddress.latitude},${order.shippingAddress.longitude}&z=18`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress.address)}`;

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950/40 p-6 shadow-xl backdrop-blur-md transition-all hover:bg-zinc-900/60 hover:border-white/10 hover:shadow-2xl">
      {/* 1. Header: ID & Price */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary border border-primary/20">
            <Receipt className="size-3" />
            <span>#{order.code.slice(0, 8)}</span>
          </div>
          <Badge variant="outline" className={cn("rounded-full border px-4 py-1 text-[10px] font-bold uppercase tracking-tighter", statusClass[order.status])}>
            {statusLabel[order.status]}
          </Badge>
        </div>
        <div className="text-2xl font-black tracking-tight text-white animate-in fade-in duration-500">
          {formatPrice(order.total)}
        </div>
      </div>

      {/* 2. Metadata Rows */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-400 border border-white/5">
          <Clock className="size-3.5 text-zinc-500" />
          <span>{format(new Date(order.createdAt), "dd/MM HH:mm", { locale: vi })}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-400 border border-white/5">
          <Package className="size-3.5 text-zinc-500" />
          <span>{order.items.length} món</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-400 border border-white/5">
          <CreditCard className="size-3.5 text-zinc-500" />
          <span className="uppercase tracking-tighter">{order.paymentMethod}</span>
        </div>
      </div>

      <div className="h-px w-full bg-white/5 mb-6" />

      {/* 3. Buyer Info */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 rotate-3 transition-transform group-hover:rotate-0">
            <span className="text-xs font-black text-primary uppercase">
              {order.shippingAddress.name?.slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-white text-lg tracking-tight truncate">{order.shippingAddress.name}</h4>
            <div className="flex items-center gap-2 text-[13px] font-bold text-primary mt-0.5">
              <Phone className="size-3" />
              <a href={`tel:${order.shippingAddress.phone}`} className="hover:underline">
                {order.shippingAddress.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 px-1 text-[13px] leading-relaxed text-zinc-500">
          <MapPin className="size-4 mt-0.5 shrink-0 text-zinc-700" />
          <a 
            href={googleMapsLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="line-clamp-2 hover:text-white transition-colors decoration-dotted underline underline-offset-4 font-medium"
          >
            {order.shippingAddress.address}
          </a>
        </div>
      </div>

      {/* 4. Items Accordion (Learned from the past) */}
      <div className="mt-4 border-t border-white/5 pt-5">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-primary transition-all active:scale-[0.98]"
        >
          <span>{expanded ? "Thu gọn danh sách" : `Xem ${order.items.length} sản phẩm`}</span>
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {expanded && (
          <div className="mt-4 space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-500">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-3 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800 border border-white/5">
                    {item.product.image ? (
                        <Image src={item.product.image} alt={item.product.name} fill sizes="40px" className="object-cover" />
                    ) : (
                        <div className="size-full flex items-center justify-center text-zinc-700"><Package className="size-5" /></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-zinc-200 truncate max-w-[120px]">
                        {item.product.name}
                    </span>
                    <span className="text-[11px] font-black text-primary/70">
                        {item.quantity}×
                    </span>
                  </div>
                </div>
                <span className="text-[13px] font-black text-white">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Main Action */}
      <Button
        onClick={() => onViewDetails(order)}
        className="mt-8 w-full h-12 bg-white/5 hover:bg-primary hover:text-white text-zinc-300 font-black tracking-widest text-[11px] rounded-[1.25rem] border border-white/10 transition-all active:scale-[0.97] group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/30"
      >
        QUẢN LÝ ĐƠN HÀNG
      </Button>
    </div>
  );
}
