"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@/types";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";

interface ProductCardProps {
  product: Product;
  gift?: Product;
  showStory?: boolean;
  showCategory?: boolean;
}

const text = {
  add: "Th\u00eam",
  added: "\u0110\u00e3 th\u00eam v\u00e0o gi\u1ecf",
  bestseller: "B\u00e1n ch\u1ea1y",
  curated: "Tuy\u1ec3n ch\u1ecdn",
  detail: "Xem chi ti\u1ebft",
  fallbackCategory: "\u0110\u1eb7c s\u1ea3n \u0110\u00e0 L\u1ea1t",
  gift: "Qu\u00e0 t\u1eb7ng",
  new: "M\u1edbi",
};

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}\u0111`;

export default function ProductCard({
  product,
  gift,
  showStory = false,
  showCategory = true,
}: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
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

  const tagText = (product.tags ?? []).join(" ").toLowerCase();
  const badgeLabel = discount > 0
    ? `-${discount}%`
    : tagText.includes("m\u1edbi") || tagText.includes("new")
      ? text.new
      : tagText.includes("b\u00e1n ch\u1ea1y") || tagText.includes("best")
        ? text.bestseller
        : text.curated;

  return (
    <article className="group flex h-full min-w-[260px] snap-start flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition duration-200 ease-in-out hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--color-accent)_36%,var(--color-border))] hover:shadow-[var(--shadow-md)]">
      <Link href={`/products/${product.product_id}`} className="block overflow-hidden" aria-label={`${text.detail} ${product.name}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
          <Image
            src={imageSrc}
            alt={product.name}
            width={420}
            height={525}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 82vw"
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.04]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-[var(--glass-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)] shadow-[var(--shadow-sm)] backdrop-blur-md">
            {badgeLabel}
          </span>
          {activeGift && (
            <span className="absolute inset-x-3 bottom-3 truncate rounded-full bg-[var(--color-warm)] px-3 py-2 text-[11px] font-semibold text-white shadow-[var(--shadow-sm)]">
              {text.gift}: {activeGift.name}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {showCategory && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            {product.category?.name ?? text.fallbackCategory}
          </p>
        )}
        <Link href={`/products/${product.product_id}`} className="mt-2 block">
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
            {product.name}
          </h3>
        </Link>

        {showStory && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{product.story}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.price < product.comparePrice && (
              <p className="text-sm text-[var(--color-text-secondary)] line-through">
                {formatPrice(product.comparePrice)}
              </p>
            )}
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-hover)]"
            onClick={() => {
              if (!isInitialized || !isLoggedIn) {
                router.push(`/login?redirect=${encodeURIComponent(pathname || "/products")}`);
                return;
              }

              addItem(product, 1);
              toast.success(text.added);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            {text.add}
          </button>
        </div>
      </div>
    </article>
  );
}
