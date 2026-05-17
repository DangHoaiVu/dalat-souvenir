"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSupabaseProductId } from "@/lib/product-id";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  gift?: Product;
  showStory?: boolean;
  showCategory?: boolean;
  className?: string;
}

const text = {
  add: "Thêm vào giỏ",
  added: "Đã thêm vào giỏ",
  bestseller: "Bán chạy",
  curated: "Tuyển chọn",
  detail: "Xem chi tiết",
  fallbackCategory: "Đặc sản Đà Lạt",
  gift: "Quà tặng",
  new: "Mới",
};

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function ProductCard({
  product,
  gift,
  showStory = false,
  showCategory = true,
  className,
}: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const addItem = useCartStore((state) => state.addItem);
  const canOrderProduct = isSupabaseProductId(product.product_id);

  if (product.is_for_sale === false) return null;

  const activeGift = gift || product.promoted_gift;
  const discount = Math.max(
    0,
    Math.round((1 - product.price / Math.max(product.comparePrice, 1)) * 100),
  );
  const imageSrc = Array.isArray(product.images) && product.images[0]
    ? product.images[0]
    : product.image || "/placeholder.png";
  const tagText = (product.tags ?? []).join(" ").toLowerCase();
  const badgeLabel = discount > 0
    ? `-${discount}%`
    : tagText.includes("mới") || tagText.includes("new")
      ? text.new
      : tagText.includes("bán chạy") || tagText.includes("best")
        ? text.bestseller
        : text.curated;

  const addToCart = () => {
    if (!isInitialized || !isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/products")}`);
      return;
    }

    if (!canOrderProduct) {
      toast.error("Sản phẩm mẫu không thể đặt hàng", {
        description: "Vui lòng chọn sản phẩm thật từ danh sách sản phẩm hiện tại.",
      });
      return;
    }

    addItem(product, 1);
    toast.success(text.added);
  };

  return (
    <Card variant="interactive" className={cn("group h-full min-w-[240px] snap-start p-0", className)}>
      <div className="relative overflow-hidden rounded-t-lg bg-surface-muted">
        <Link href={`/products/${product.product_id}`} aria-label={`${text.detail} ${product.name}`}>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={imageSrc}
              alt={product.name}
              width={480}
              height={600}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 92vw"
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        <span className="absolute left-3 top-3 rounded-full bg-warning px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-warning-text shadow-sm">
          {badgeLabel}
        </span>

        <button
          type="button"
          className="absolute right-3 top-3 hidden size-10 items-center justify-center rounded-full border border-[--color-border] bg-surface/90 text-tertiary opacity-0 shadow-sm backdrop-blur transition-opacity duration-200 hover:text-accent group-hover:opacity-100 md:flex"
          aria-label="Thêm vào yêu thích"
        >
          <Heart className="size-4" />
        </button>

        {activeGift && (
          <span className="absolute inset-x-3 bottom-3 truncate rounded-md bg-surface/92 px-3 py-2 text-xs font-semibold text-accent-text shadow-sm backdrop-blur">
            {text.gift}: {activeGift.name}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full p-3 transition-transform duration-200 group-hover:translate-y-0 md:block">
          <Button type="button" className="w-full shadow-lg" onClick={addToCart} disabled={!canOrderProduct}>
            <ShoppingCart className="size-4" />
            {text.add}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {showCategory && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
            {product.category?.name ?? text.fallbackCategory}
          </p>
        )}

        <Link href={`/products/${product.product_id}`} className="mt-2 block">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-primary transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>

        {showStory && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">{product.story}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {product.price < product.comparePrice && (
              <p className="text-sm text-tertiary line-through">
                {formatPrice(product.comparePrice)}
              </p>
            )}
            <p className="text-lg font-semibold text-accent">{formatPrice(product.price)}</p>
          </div>
          <Button
            type="button"
            size="icon"
            className="md:hidden"
            onClick={addToCart}
            disabled={!canOrderProduct}
            aria-label={text.add}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
