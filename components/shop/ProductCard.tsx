"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import GlassButton from "@/components/ui/GlassButton";
import { useCartStore } from "@/stores/cartStore";

interface ProductCardProps {
  product: Product;
  gift?: Product;
  showStory?: boolean;
  showCategory?: boolean;
}

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function ProductCard({
  product,
  gift,
  showStory = false,
  showCategory = true,
}: ProductCardProps) {
  const { addItem } = useCartStore();
  
  if (product.is_for_sale === false) return null;
  
  const activeGift = gift || product.promoted_gift;

  const discount = Math.max(
    0,
    Math.round((1 - product.price / Math.max(product.comparePrice, 1)) * 100),
  );

  const imageSrc = Array.isArray(product.images) && product.images[0]
    ? product.images[0]
    : product.image || "/placeholder.png";

  const filteredTags = (product.tags ?? []).filter(
    (tag: string) => tag !== "Bán chạy" && tag !== "Mới"
  );

  return (
    <Link href={`/products/${product.product_id}`} className="group block h-full animate-fade-in-up">
      <div className="h-full cursor-pointer flex flex-col justify-between relative overflow-hidden bg-card rounded-[24px] border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-border/80">
        <div className="relative overflow-hidden aspect-[4/5] bg-muted/30">
          <img
            src={imageSrc}
            alt={product.name}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {filteredTags.map((tag: string) => (
              <div key={tag} className="bg-background/80 text-foreground backdrop-blur-md border border-border/50 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm uppercase tracking-wider">
                {tag}
              </div>
            ))}
          </div>

          {/* Hover overlay button */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20 flex justify-center">
            <GlassButton
              variant="pill"
              className="w-full justify-center bg-background/80 dark:bg-background/50 text-foreground hover:bg-background shadow-md border border-border/50 backdrop-blur-xl"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                addItem(product, 1);
                toast.success("Đã thêm vào giỏ");
              }}
            >
              <Plus className="size-4 mr-1" />
              Thêm vào giỏ
            </GlassButton>
          </div>

          {activeGift && (
            <div className="absolute bottom-0 left-0 right-0 bg-secondary/80 text-white text-[10px] font-bold py-2 px-3 flex items-center gap-2 backdrop-blur-xl transition-transform duration-500 group-hover:translate-y-full z-10 border-t border-white/20">
              <span className="shrink-0 bg-white text-secondary rounded shadow-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wider">Quà tặng</span>
              <span className="truncate uppercase tracking-tight">{activeGift.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-1 p-5 md:p-6 bg-card">
          <div className="flex-1 space-y-2">
            {showCategory && (
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.25em] font-semibold">
                {product.category?.name ?? ""}
              </p>
            )}
            <h3 className="line-clamp-2 text-[18px] md:text-[20px] font-sans font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-[1.15]">
              {product.name}
            </h3>
          </div>
          
          {showStory && (
            <p className="mt-2 line-clamp-2 text-xs italic text-muted-foreground font-serif leading-relaxed">{product.story}</p>
          )}
          
          <div className="flex items-center justify-between gap-2 pt-4 mt-auto border-t border-white/30">
            <div className="flex flex-col">
              {product.price < product.comparePrice && (
                <p className="text-[13px] text-muted-foreground line-through font-medium tracking-tight">
                  {formatPrice(product.comparePrice)}
                </p>
              )}
              <p className="text-[18px] md:text-[20px] font-bold font-sans text-secondary tracking-tight">
                {formatPrice(product.price)}
              </p>
            </div>
            {discount > 0 && (
              <div className="bg-secondary/20 text-secondary border border-secondary/30 font-bold px-2 py-0.5 rounded-full text-[10px] backdrop-blur-md">
                -{discount}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
