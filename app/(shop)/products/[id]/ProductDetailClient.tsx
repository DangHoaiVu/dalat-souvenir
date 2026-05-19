"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Package, RotateCcw, ShoppingCart, Star, Truck } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import ProductCard from "@/components/shop/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types";

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { addItem, openCart } = useCartStore();
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ["https://picsum.photos/seed/product-placeholder/900/900"];
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const selectedImage = gallery[selectedIndex] ?? gallery[0] ?? "";
  const discount = Math.max(
    0,
    Math.round((1 - product.price / Math.max(product.comparePrice, 1)) * 100),
  );
  const tags = product.tags ?? [];

  const increase = () => setQuantity((value) => Math.min(value + 1, product.stock));
  const decrease = () => setQuantity((value) => Math.max(value - 1, 1));

  const addToCart = () => {
    if (!isInitialized || !isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/products/${product.product_id}`)}`);
      return;
    }

    addItem(product, quantity);
    openCart();
    toast.success("Đã thêm vào giỏ hàng", {
      description: `${quantity} x ${product.name}`,
    });
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null || gallery.length <= 1) return;
    const delta = touchStartX.current - clientX;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;

    setSelectedIndex((current) => {
      if (delta > 0) return Math.min(current + 1, gallery.length - 1);
      return Math.max(current - 1, 0);
    });
  };

  return (
    <div className="bg-background pb-28 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-tertiary sm:text-xs [&_a]:inline-flex [&_a]:min-h-7 [&_a]:items-center" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-accent">Trang chủ</Link>
          <ChevronRight className="size-3 shrink-0 self-center" />
          <Link href={`/products?category=${product.category?.slug ?? ""}`} className="inline-flex min-h-7 max-w-[48vw] items-center truncate transition-colors hover:text-accent sm:max-w-none">
            {product.category?.name}
          </Link>
          <ChevronRight className="size-3 shrink-0 self-center" />
          <span className="inline-flex min-h-7 max-w-[72vw] items-center truncate text-primary sm:max-w-[320px]">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-7">
            <Card className="p-0">
              <div
                className="relative aspect-[4/5] w-full touch-pan-y overflow-hidden rounded-lg bg-surface-muted md:aspect-square"
                onTouchStart={(event) => {
                  touchStartX.current = event.changedTouches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
              >
                <Image
                  src={selectedImage}
                  alt={product.name}
                  width={1200}
                  height={1200}
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} className="bg-surface/90 text-accent backdrop-blur">
                      {tag}
                    </Badge>
                  ))}
                  {discount > 0 && (
                    <Badge className="w-fit bg-warning text-warning-text">
                      -{discount}%
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {gallery.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:size-24 ${
                      selectedIndex === idx ? "border-accent shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <Image src={img} alt={`Ảnh sản phẩm ${idx + 1}`} fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col pt-2 lg:col-span-5 lg:pt-8">
            <Link href={`/products?category=${product.category?.slug ?? ""}`} className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {product.category?.name}
            </Link>

            <h1 className="mb-4 text-[32px] font-bold leading-tight text-primary md:text-[40px]">
              {product.name}
            </h1>

            <div className="mb-7 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex text-warning">
                <Star className="size-4 fill-current" />
              </div>
              <span className="font-medium text-primary">
                {product.avgRating ?? "5.0"} <span className="font-normal text-secondary">({product.reviewCount ?? 0} đánh giá)</span>
              </span>
              <span className="h-4 w-px bg-border" />
              <span className={`text-xs font-bold uppercase tracking-[0.12em] ${product.stock > 0 ? "text-success" : "text-error"}`}>
                {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>

            <div className="mb-8 flex items-end gap-4">
              <span className="text-[32px] font-bold tracking-tight text-accent">{formatPrice(product.price)}</span>
              {product.comparePrice > product.price && (
                <span className="mb-1.5 text-[18px] text-tertiary line-through">{formatPrice(product.comparePrice)}</span>
              )}
            </div>

            <p className="mb-8 line-clamp-6 whitespace-pre-line text-base leading-7 text-secondary">
              {product.description}
            </p>

            {product.promoted_gift && (
              <Card variant="flat" className="mb-8 bg-accent-light p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-accent text-white">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold uppercase tracking-[0.1em] text-primary">Ưu đãi tặng kèm</span>
                    <span className="text-xs text-secondary">Mua sản phẩm này được tặng phần quà sau</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border border-[--color-border] bg-surface p-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={product.promoted_gift.images?.[0] ?? product.promoted_gift.image ?? "/placeholder.png"}
                      alt={product.promoted_gift.name ?? "Quà tặng"}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="line-clamp-1 text-sm font-bold text-primary">{product.promoted_gift.name}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">Miễn phí</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="mb-10 hidden flex-col gap-4 lg:flex">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-[--color-border] bg-surface p-1 shadow-sm">
                  <button onClick={decrease} disabled={quantity <= 1} className="flex size-10 items-center justify-center rounded-full text-primary transition hover:bg-surface-muted disabled:opacity-40">-</button>
                  <span className="w-12 text-center font-bold text-primary">{quantity}</span>
                  <button onClick={increase} disabled={quantity >= product.stock} className="flex size-10 items-center justify-center rounded-full text-primary transition hover:bg-surface-muted disabled:opacity-40">+</button>
                </div>
                <p className="text-xs font-medium text-secondary">
                  {product.unit ? `Đơn vị: ${product.unit}` : product.weightGram ? `Khối lượng: ${product.weightGram}g` : ""}
                </p>
              </div>

              <Button size="lg" className="w-full" disabled={product.stock <= 0} onClick={addToCart}>
                <ShoppingCart className="size-5" />
                Thêm vào giỏ hàng
              </Button>
            </div>

            <div className="grid gap-4 border-t border-[--color-border] pt-8 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
                  <Truck className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">Giao hàng toàn quốc</h4>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">Nhận hàng trong 2-4 ngày làm việc.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
                  <RotateCcw className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">Đổi trả dễ dàng</h4>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">7 ngày hoàn tiền nếu sản phẩm lỗi.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-[--color-border] pt-8">
              <h3 className="mb-4 text-xl font-bold text-primary">Chi tiết sản phẩm</h3>
              <p className="whitespace-pre-line text-sm leading-7 text-secondary">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Gợi ý thêm</p>
            <h2 className="text-3xl font-bold text-primary">Có thể bạn sẽ thích</h2>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:overflow-visible">
            {relatedProducts.map((item) => (
              <ProductCard key={item.product_id} product={item} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-[--color-border] bg-surface/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-sm lg:hidden">
        <div className="flex min-w-0 flex-col justify-center">
          <span className="text-xs text-secondary">Tổng</span>
          <span className="text-xl font-bold text-accent">{formatPrice(product.price * quantity)}</span>
        </div>
        <Button className="flex-1" disabled={product.stock <= 0} onClick={addToCart}>
          <ShoppingCart className="size-4" />
          Thêm vào giỏ
        </Button>
      </div>
    </div>
  );
}
