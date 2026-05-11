import { 
  ArrowLeft, 
  Gift, 
  Percent, 
  CircleDollarSign,
  Calendar,
  Info,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import ProductCard from "@/components/shop/ProductCard";
import { fetchPromotionDetails } from "@/lib/shop-data";

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

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Centered Content Wrapper */}
      <div className="max-w-5xl mx-auto px-4 pt-10 md:pt-16 space-y-12">
        
        {/* Navigation & Status */}
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="size-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
              <ArrowLeft className="size-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest">Trang chủ</span>
          </Link>
          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest animate-pulse">
            Đang diễn ra
          </Badge>
        </div>

        {/* Main Header Card - Aligned with Admin Design */}
        <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            {/* Banner Image Card */}
            <div className="w-full md:w-[400px] lg:w-[480px] shrink-0 rounded-[2rem] overflow-hidden bg-muted border border-border shadow-2xl shadow-black/10">
              <img 
                src={promotion.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"} 
                alt={promotion.name}
                className="w-full h-auto block hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Title & Info Column */}
            <div className="flex-1 space-y-6 md:pt-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                  <Sparkles className="size-3 fill-primary/20" />
                  <span>Ưu đãi đặc biệt</span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
                  {promotion.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <span className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-2xl border border-border text-muted-foreground text-xs font-bold font-mono">
                    <Calendar className="size-3.5 text-primary/60" />
                    {new Date(promotion.start_date).toLocaleDateString('vi-VN')} - {new Date(promotion.end_date).toLocaleDateString('vi-VN')}
                  </span>
                  {promotion.fixed_price && (
                    <span className="flex items-center gap-2 text-primary font-black text-xl">
                      <CircleDollarSign className="size-5" />
                      Đồng giá: {formatPrice(promotion.fixed_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section - Full Width Bottom (Matching Admin) */}
          <div className="mt-8 pt-8 border-t border-border space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-[0.3em] text-[9px] font-black">
              <Info className="size-3 text-primary/40" />
              <span>Nội dung khuyến mãi</span>
            </div>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base font-medium max-w-4xl">
              {promotion.description || "Chương trình chưa được cập nhật mô tả chi tiết."}
            </div>
          </div>
        </Card>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {promotion.fixed_price && (
             <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] flex items-center gap-5 transition-all hover:bg-primary/10 group">
                <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <CircleDollarSign className="size-7" />
                </div>
                <div>
                   <h3 className="text-muted-foreground text-[9px] uppercase font-black tracking-[0.2em] mb-0.5">Mức giá</h3>
                   <p className="text-lg font-black text-foreground">Đồng giá {formatPrice(promotion.fixed_price)}</p>
                </div>
             </div>
           )}
           <div className="bg-card border border-border p-6 rounded-[2rem] flex items-center gap-5 transition-all hover:bg-secondary/40 group">
              <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                 <Percent className="size-7" />
              </div>
              <div>
                 <h3 className="text-muted-foreground text-[9px] uppercase font-black tracking-[0.2em] mb-0.5">Tiết kiệm</h3>
                 <p className="text-lg font-black text-foreground">Ưu đãi tốt nhất</p>
              </div>
           </div>
           <div className="bg-card border border-border p-6 rounded-[2rem] flex items-center gap-5 transition-all hover:bg-secondary/40 group">
              <div className="size-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                 <Gift className="size-7" />
              </div>
              <div>
                 <h3 className="text-muted-foreground text-[9px] uppercase font-black tracking-[0.2em] mb-0.5">Tặng kèm</h3>
                 <p className="text-lg font-black text-foreground">Quà cho mỗi đơn</p>
              </div>
           </div>
        </div>

        {/* Product Grid Section */}
        <div className="space-y-8 pt-6">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
              <div className="size-8 rounded-xl bg-primary/20 flex items-center justify-center">
                 <div className="size-2.5 rounded-full bg-primary" />
              </div>
              Sản phẩm ưu đãi
            </h2>
            <Badge variant="outline" className="text-muted-foreground border-border rounded-full font-bold px-3 py-1">
              {promotion.items.length} lựa chọn
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {promotion.items.map((item: any) => (
              <ProductCard 
                key={item.product_id} 
                product={item.product} 
                gift={item.gift_product}
              />
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-20">
           <div className="p-10 rounded-[3rem] bg-card border border-border flex flex-col items-center text-center space-y-6 shadow-xl">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                 <Sparkles className="size-8 text-primary" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-2xl font-black text-foreground tracking-tight">Săn ngay ưu đãi giới hạn</h4>
                 <p className="text-muted-foreground max-w-md mx-auto">Tất cả sản phẩm đều được tuyển chọn như những món quà nhỏ gợi nhớ Đà Lạt.</p>
              </div>
              <Link 
                href="/products" 
                className="bg-primary text-white hover:bg-primary/90 px-12 h-14 rounded-full flex items-center font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20"
              >
                Tiếp tục mua hàng
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
