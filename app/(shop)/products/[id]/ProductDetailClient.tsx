"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, ChevronRight, Package, Truck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import ProductCard from "@/components/shop/ProductCard";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import type { Product } from "@/types";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";

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
  const [selectedImage, setSelectedImage] = useState(gallery[0] ?? "");

  const discount = Math.max(
    0,
    Math.round((1 - product.price / Math.max(product.comparePrice, 1)) * 100),
  );
  const tags = product.tags ?? [];

  const increase = () => setQuantity((value) => Math.min(value + 1, product.stock));
  const decrease = () => setQuantity((value) => Math.max(value - 1, 1));

  return (
    <div className="bg-background pb-24">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          <Link href="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="size-3" />
          <Link
            href={`/products?category=${product.category?.slug ?? ""}`}
            className="hover:text-primary transition-colors"
          >
            {product.category?.name}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          
          {/* Image Gallery Column (Sticky) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 flex flex-col gap-4">
            <GlassCard className="!rounded-[2rem]">
              <div className="relative w-full aspect-[4/5] md:aspect-square group">
              <Image
                src={selectedImage}
                alt={product.name}
                width={1200}
                height={1200}
                priority
                className="aspect-[4/5] md:aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} className="bg-white/80 text-primary backdrop-blur-md border-white/50 uppercase tracking-widest text-[10px] font-bold shadow-sm">
                    {tag}
                  </Badge>
                ))}
                {discount > 0 && (
                  <Badge className="bg-secondary/90 text-white backdrop-blur-md border-secondary/50 uppercase tracking-widest text-[10px] font-bold shadow-sm w-fit">
                    -{discount}%
                  </Badge>
                )}
              </div>
              </div>
            </GlassCard>
            
            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative size-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${selectedImage === img ? "border-primary shadow-md scale-100" : "border-transparent opacity-60 hover:opacity-100 scale-95"}`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Column */}
          <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-10">
            <Link
              href={`/products?category=${product.category?.slug ?? ""}`}
              className="text-xs font-bold tracking-widest text-secondary uppercase mb-4 inline-block"
            >
              {product.category?.name}
            </Link>
            
            <h1 className="text-[32px] md:text-[40px] font-sans font-bold text-foreground leading-[1.15] mb-4 drop-shadow-sm tracking-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-3 text-sm mb-8">
              <div className="flex text-yellow-500">
                <Star className="size-4 fill-current" />
              </div>
              <span className="font-medium text-foreground">
                {product.avgRating ?? "5.0"} <span className="text-muted-foreground font-normal">({product.reviewCount ?? 0} đánh giá)</span>
              </span>
              <span className="h-4 w-px bg-border/50"></span>
              <span className={`font-bold uppercase tracking-wider text-[10px] ${product.stock > 0 ? "text-primary" : "text-destructive"}`}>
                {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>
            
            <div className="flex items-end gap-4 mb-10">
              <span className="text-[32px] font-sans font-bold text-primary tracking-tight drop-shadow-sm">{formatPrice(product.price)}</span>
              {product.comparePrice > product.price && (
                <span className="text-[18px] text-muted-foreground line-through mb-1.5">{formatPrice(product.comparePrice)}</span>
              )}
            </div>

            <div className="text-[15px] md:text-[16px] text-muted-foreground leading-[1.7] mb-10 font-medium">
              <p className="whitespace-pre-line line-clamp-6">{product.description}</p>
            </div>

            {/* Gift Promotion Box */}
            {product.promoted_gift && (
              <div className="mb-10 rounded-2xl bg-white/20 backdrop-blur-lg p-5 border border-white/40 relative overflow-hidden group shadow-[0_10px_30px_rgba(31,41,51,0.05)]">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="flex items-center gap-3 mb-4">
                   <div className="flex items-center justify-center size-8 rounded-full bg-secondary/80 text-white backdrop-blur-sm shadow-sm border border-secondary/50">
                     <Package className="size-4" />
                   </div>
                   <div>
                     <span className="text-sm font-bold text-foreground uppercase tracking-wider block">Ưu đãi tặng kèm</span>
                     <span className="text-xs text-muted-foreground">Mua sản phẩm này được tặng phần quà sau</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-4 bg-white/40 rounded-xl p-3 border border-white/50 backdrop-blur-md shadow-inner">
                   <div className="size-16 rounded-lg overflow-hidden shrink-0 shadow-sm relative">
                     <Image
                      src={product.promoted_gift.images?.[0] ?? product.promoted_gift.image ?? "/placeholder.png"}
                      alt={product.promoted_gift.name}
                      fill
                      className="object-cover"
                     />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-foreground line-clamp-1">{product.promoted_gift.name}</p>
                      <p className="text-xs text-secondary font-bold tracking-wider uppercase mt-1">Miễn phí</p>
                   </div>
                 </div>
              </div>
            )}

            {/* Add to Cart Actions */}
            <div className="flex flex-col gap-4 mb-12">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-full border border-white/40 bg-white/30 backdrop-blur-sm shadow-sm p-1">
                  <button onClick={decrease} disabled={quantity <= 1} className="size-10 flex items-center justify-center rounded-full hover:bg-white/50 text-foreground transition-colors disabled:opacity-50 font-medium active:scale-95">
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-foreground">{quantity}</span>
                  <button onClick={increase} disabled={quantity >= product.stock} className="size-10 flex items-center justify-center rounded-full hover:bg-white/50 text-foreground transition-colors disabled:opacity-50 font-medium active:scale-95">
                    +
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {product.unit ? `Đơn vị: ${product.unit}` : (product.weightGram ? `Khối lượng: ${product.weightGram}g` : "")}
                </p>
              </div>

              <GlassButton
                variant="primary"
                className="w-full"
                disabled={product.stock <= 0}
                onClick={() => {
                  if (!isInitialized || !isLoggedIn) {
                    router.push(`/login?redirect=${encodeURIComponent(`/products/${product.product_id}`)}`);
                    return;
                  }

                  addItem(product, quantity);
                  openCart();
                  toast.success("Đã thêm vào giỏ hàng", {
                    description: `${quantity} x ${product.name}`,
                  });
                }}
              >
                <ShoppingCart className="mr-2 size-5" />
                Thêm vào giỏ hàng
              </GlassButton>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-8">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-primary">
                  <Truck className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Giao hàng toàn quốc</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Nhận hàng trong 2-4 ngày làm việc.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 size-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-primary">
                  <RotateCcw className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Đổi trả dễ dàng</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">7 ngày hoàn tiền nếu sản phẩm lỗi.</p>
                </div>
              </div>
            </div>

            {/* Full Description Accordion (Simulated) */}
            <div className="mt-12 border-t border-border pt-10">
              <h3 className="text-xl font-serif font-bold text-foreground mb-6">Chi tiết sản phẩm</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-loose">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mt-32">
          <div className="mb-10 flex flex-col items-center text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-2">Gợi ý thêm</p>
            <h2 className="text-3xl font-serif font-bold text-foreground">Có thể bạn sẽ thích</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-8">
            {relatedProducts.map((item) => (
              <ProductCard key={item.product_id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
