"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgePercent, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { ActivePromotion } from "@/lib/shop-data";

interface PromotionPopupProps {
  promotion: ActivePromotion | null;
}

export default function PromotionPopup({ promotion }: PromotionPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!promotion) return;

    const storageKey = `promotion-popup-dismissed:${promotion.promotion_id}`;
    if (sessionStorage.getItem(storageKey) === "1") return;

    const timer = window.setTimeout(() => setOpen(true), 550);
    return () => window.clearTimeout(timer);
  }, [promotion]);

  if (!promotion || !open) return null;

  const close = () => {
    sessionStorage.setItem(`promotion-popup-dismissed:${promotion.promotion_id}`, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-2xl">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full border border-sky-100 bg-white/90 text-slate-700 shadow-sm transition hover:bg-sky-50 hover:text-sky-700"
          aria-label="Đóng thông báo khuyến mãi"
        >
          <X className="size-5" />
        </button>

        <div className="grid gap-0 md:grid-cols-[0.94fr_1.06fr]">
          <div className="relative min-h-[220px] bg-sky-50 md:min-h-[420px]">
            {promotion.image ? (
              <Image
                src={promotion.image}
                alt={promotion.name}
                fill
                sizes="(min-width: 768px) 360px, 100vw"
                className="object-contain p-4"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-linear-to-br from-sky-100 to-cyan-50 text-sky-600">
                <BadgePercent className="size-20" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700">
              <BadgePercent className="size-4" />
              Ưu đãi từ shop
            </div>
            <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              {promotion.name}
            </h2>
            {promotion.fixed_price ? (
              <p className="mt-3 text-lg font-black text-amber-500">
                Đồng giá {formatPrice(promotion.fixed_price)}
              </p>
            ) : null}
            {promotion.description ? (
              <p className="mt-4 line-clamp-5 text-sm leading-6 text-slate-600">
                {promotion.description}
              </p>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Khám phá các sản phẩm đang được áp dụng ưu đãi và chọn món quà phù hợp.
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/promotions/${promotion.promotion_id}`}
                onClick={close}
                className="inline-flex h-12 items-center justify-center rounded-full bg-sky-500 px-6 text-sm font-bold text-white transition hover:bg-sky-600"
              >
                Xem ưu đãi
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={close}
                className="h-12 rounded-full border-sky-100 px-6 font-bold text-slate-700 hover:bg-sky-50"
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
