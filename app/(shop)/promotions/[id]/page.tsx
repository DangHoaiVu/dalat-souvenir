import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CircleDollarSign, Gift, Info, Percent, Sparkles } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchPromotionDetails, type PromotionDetailItem } from "@/lib/shop-data";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type PromotionPageItem = PromotionDetailItem & { product: Product };

interface PromotionPageProps {
  params: {
    id: string;
  };
}

export default async function PromotionPage({ params }: PromotionPageProps) {
  const promotion = await fetchPromotionDetails(params.id);

  if (!promotion || !promotion.is_active) {
    notFound();
  }

  const imageSrc =
    promotion.image ||
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop";
  const promotionItems = promotion.items.filter((item): item is PromotionPageItem => Boolean(item.product));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-10 sm:px-6 md:pt-14 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-secondary transition-colors hover:text-accent">
            <div className="flex size-9 items-center justify-center rounded-full bg-accent-light text-accent transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft className="size-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Trang chủ</span>
          </Link>
          <Badge className="rounded-full bg-success-light px-4 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-success-text">
            Đang diễn ra
          </Badge>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] md:p-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted md:aspect-square">
              <Image
                src={imageSrc}
                alt={promotion.name}
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-contain p-2 transition-transform duration-500 hover:scale-[1.02]"
                priority
              />
            </div>

            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  <Sparkles className="size-3" />
                  <span>Ưu đãi đặc biệt</span>
                </div>

                <h1 className="text-3xl font-bold leading-tight text-primary md:text-5xl">
                  {promotion.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-surface-muted px-4 py-2 text-xs font-semibold text-secondary">
                    <Calendar className="size-3.5 text-accent" />
                    {new Date(promotion.start_date).toLocaleDateString("vi-VN")} - {new Date(promotion.end_date).toLocaleDateString("vi-VN")}
                  </span>
                  {promotion.fixed_price && (
                    <span className="flex items-center gap-2 text-xl font-bold text-accent">
                      <CircleDollarSign className="size-5" />
                      Đồng giá: {formatPrice(promotion.fixed_price)}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-[--color-border] pt-6">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">
                  <Info className="size-3 text-accent" />
                  <span>Nội dung khuyến mãi</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-secondary md:text-base">
                  {promotion.description || "Chương trình chưa được cập nhật mô tả chi tiết."}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotion.fixed_price && (
            <Card variant="flat" className="flex-row items-center gap-5 p-5">
              <div className="flex size-12 items-center justify-center rounded-lg bg-accent-light text-accent">
                <CircleDollarSign className="size-6" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-tertiary">Mức giá</h3>
                <p className="text-lg font-bold text-primary">Đồng giá {formatPrice(promotion.fixed_price)}</p>
              </div>
            </Card>
          )}
          <Card variant="flat" className="flex-row items-center gap-5 p-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-warning-light text-warning">
              <Percent className="size-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-tertiary">Tiết kiệm</h3>
              <p className="text-lg font-bold text-primary">Ưu đãi tốt nhất</p>
            </div>
          </Card>
          <Card variant="flat" className="flex-row items-center gap-5 p-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-accent-light text-accent">
              <Gift className="size-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-tertiary">Tặng kèm</h3>
              <p className="text-lg font-bold text-primary">Quà cho mỗi đơn</p>
            </div>
          </Card>
        </div>

        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[--color-border] pb-5">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-primary md:text-3xl">
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent-light">
                <span className="size-2.5 rounded-full bg-accent" />
              </span>
              Sản phẩm ưu đãi
            </h2>
            <Badge variant="outline" className="rounded-full border-[--color-border] px-3 py-1 text-secondary">
              {promotionItems.length} lựa chọn
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {promotionItems.map((item) => (
              <ProductCard
                key={item.product_id}
                product={item.product}
                gift={item.gift_product ?? undefined}
              />
            ))}
          </div>
        </section>

        <Card className="items-center p-8 text-center md:p-10">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-accent-light text-accent">
            <Sparkles className="size-7" />
          </div>
          <h4 className="text-2xl font-bold text-primary">Săn ngay ưu đãi giới hạn</h4>
          <p className="max-w-md text-secondary">
            Tất cả sản phẩm đều được tuyển chọn như những món quà nhỏ gợi nhớ Đà Lạt.
          </p>
          <Link href="/products" className="mt-3 inline-flex min-h-12 items-center rounded-md bg-accent px-8 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-md">
            Tiếp tục mua hàng
          </Link>
        </Card>
      </div>
    </div>
  );
}
