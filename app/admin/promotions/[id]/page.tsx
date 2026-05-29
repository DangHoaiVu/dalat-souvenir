"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Pencil, 
  Trash2, 
  Gift, 
  CircleDollarSign,
  Info,
  Calendar,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { authFetch } from "@/lib/auth-fetch";
import { cn, formatPrice } from "@/lib/utils";
import type { Promotion, Product } from "@/types";

const PromotionItemSheet = dynamic(() => import("@/components/admin/promotions/PromotionItemSheet"), {
  ssr: false,
});
const PromotionSheet = dynamic(() => import("@/components/admin/PromotionSheet"), {
  ssr: false,
});

interface ExtendedPromotion extends Promotion {
  items: Array<{
    promotion_item_id: string;
    product_id: string;
    discount_percentage?: number;
    gift_product_id?: string;
    product: Product;
    gift_product?: Product;
  }>;
}

type PromotionDetailItem = ExtendedPromotion["items"][number];

export default function PromotionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [promotion, setPromotion] = useState<ExtendedPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet states
  const [openItemSheet, setOpenItemSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<PromotionDetailItem | null>(null);
  const [openInfoSheet, setOpenInfoSheet] = useState(false);

  const fetchPromotion = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/promotions/${id}`);
      const data = await res.json();
      if (res.ok) {
        setPromotion(data);
      } else {
        const errorMsg = data.error || "Không tìm thấy chương trình";
        toast.error(`Lỗi: ${errorMsg}`);
        router.push("/admin/promotions");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không xác định";
      toast.error(`Lỗi kết nối: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchPromotion();
  }, [fetchPromotion]);

  const handleDeleteItem = async (productId: string) => {
    if (!confirm("Xóa sản phẩm này khỏi chương trình khuyến mãi?")) return;
    
    try {
      const res = await authFetch(`/api/promotions/${id}?product_id=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Đã xóa sản phẩm");
        fetchPromotion();
      } else {
        toast.error("Không thể xóa sản phẩm");
      }
    } catch {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  const handleDeletePromotion = async () => {
    if (!promotion) return;
    if (!confirm(`Xóa khuyến mãi "${promotion.name}"? Các sản phẩm áp dụng sẽ được gỡ ưu đãi.`)) return;

    try {
      const res = await authFetch(`/api/promotions?id=${promotion.promotion_id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success("Đã xóa khuyến mãi");
        router.push("/admin/promotions");
      } else {
        toast.error(data?.error || "Không thể xóa khuyến mãi");
      }
    } catch {
      toast.error("Lỗi khi xóa khuyến mãi");
    }
  };

  if (isLoading && !promotion) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải chi tiết khuyến mãi...</p>
      </div>
    );
  }

  if (!promotion) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 px-4 md:px-0">
      {/* Sheets */}
      <PromotionItemSheet 
        open={openItemSheet} 
        onOpenChange={setOpenItemSheet} 
        promotion={promotion} 
        item={editingItem} 
        onSave={fetchPromotion} 
      />
      <PromotionSheet 
        open={openInfoSheet} 
        onOpenChange={setOpenInfoSheet} 
        promotion={promotion} 
        onSave={() => {
          fetchPromotion();
          toast.success("Đã cập nhật thông tin chương trình");
        }} 
      />

      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/promotions"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="size-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
            <ArrowLeft className="size-4" />
          </div>
          <span className="font-medium text-sm">Danh sách</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "font-bold px-3 py-1 border-none",
            promotion.is_active ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
          )}>
            {promotion.is_active ? "Đang hoạt động" : "Sắp hoạt động"}
          </Badge>
          <Button
            variant="outline"
            onClick={handleDeletePromotion}
            className="h-9 rounded-full border-destructive/30 px-4 text-xs font-bold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 size-4" />
            Xóa khuyến mãi
          </Button>
        </div>
      </div>

      {/* Main Promotion Info Card */}
      <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
        <div className="pt-6 px-8 pb-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Full Uncropped Banner Image */}
            <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[2rem] border border-border bg-muted shadow-2xl shadow-black/20 md:w-[480px]">
              <Image
                src={promotion.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"}
                alt={promotion.name}
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-contain p-2 transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>

            {/* Title & Info Column */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                    <PlusCircle className="size-3" />
                    <span>Chi tiết chương trình</span>
                  </div>
                  <Button
                      variant="outline" 
                      onClick={() => setOpenInfoSheet(true)}
                      className="rounded-2xl border-border bg-secondary hover:bg-secondary/80 shrink-0 px-6 gap-2 h-10 text-xs font-bold"
                    >
                      <Pencil className="size-3.5" />
                      Sửa chương trình
                    </Button>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">{promotion.name}</h1>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-muted-foreground font-medium text-sm">
                  <span className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-2xl border border-border">
                    <Calendar className="size-4 text-primary/60" />
                    {new Date(promotion.start_date).toLocaleDateString('vi-VN')} - {new Date(promotion.end_date).toLocaleDateString('vi-VN')}
                  </span>
                  {promotion.fixed_price && (
                    <span className="flex items-center gap-2 text-yellow-500 font-black text-lg">
                      <CircleDollarSign className="size-5" />
                      Đồng giá: {formatPrice(promotion.fixed_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section - Full Width Bottom */}
          <div className="mt-8 pt-8 border-t border-border space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-[0.3em] text-[9px] font-black">
              <Info className="size-3 text-primary/40" />
              <span>Nội dung khuyến mãi</span>
            </div>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base font-medium max-w-4xl">
              {promotion.description || "Chương trình chưa được cập nhật mô tả chi tiết."}
            </div>
          </div>
        </div>
      </Card>

      {/* Add Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="size-6 text-primary" />
              </div>
              Sản phẩm áp dụng ({promotion.items.length})
            </h2>
            <p className="text-sm text-muted-foreground font-medium ml-13">Quản lý các sản phẩm sẽ được hưởng ưu đãi này.</p>
          </div>
          <Button
              onClick={() => {
                setEditingItem(null);
                setOpenItemSheet(true);
              }}
              className="rounded-full bg-primary hover:bg-primary/90 px-8 h-12 font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="size-5 mr-2" />
              Thêm sản phẩm
            </Button>
        </div>

        {promotion.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotion.items.map((item) => (
              <PromotionItemCard 
                key={item.promotion_item_id} 
                item={item} 
                promotion={promotion} 
                onEdit={() => {
                  setEditingItem(item);
                  setOpenItemSheet(true);
                }}
                onDelete={() => handleDeleteItem(item.product_id)}
              />
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setOpenItemSheet(true);
            }}
            className="h-60 w-full rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/20 transition hover:border-primary/40 hover:bg-primary/5"
          >
             <div className="size-20 rounded-full bg-muted flex items-center justify-center animate-pulse">
               <PlusCircle className="size-10 text-muted-foreground/50" />
             </div>
             <div className="text-center">
                <p className="font-bold text-lg text-muted-foreground italic">Chưa có sản phẩm nào</p>
                <p className="text-sm">Hãy bắt đầu bằng cách thêm sản phẩm đầu tiên vào chương trình.</p>
             </div>
          </button>
        )}
      </div>
    </div>
  );
}

function PromotionItemCard({
  item,
  promotion,
  onEdit,
  onDelete,
}: {
  item: PromotionDetailItem;
  promotion: Promotion;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const product = item.product;
  const hasFixedPrice = promotion.fixed_price != null && !item.discount_percentage;
  
  // Logic Fix: finalPrice shouldn't exceed original price in UI display
  let finalPrice = product.price;
  if (hasFixedPrice && promotion.fixed_price != null) {
    finalPrice = promotion.fixed_price;
  } else if (item.discount_percentage) {
    finalPrice = Math.round(product.price * (1 - item.discount_percentage / 100));
  }
  
  if (finalPrice > product.price) finalPrice = product.price;

  const offPercentage = Math.round((1 - finalPrice / product.price) * 100);

  return (
    <Card className="group relative overflow-hidden border-border bg-card p-5 transition-all hover:bg-secondary/40 hover:border-primary/20 shadow-xl rounded-[2rem]">
       <div className="flex gap-5">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-3xl border border-border bg-muted shadow-inner">
             <Image
               src={product.image || product.images?.[0] || "/placeholder.png"}
               alt={product.name}
               fill
               sizes="112px"
               className="object-cover transition-transform duration-700 group-hover:scale-110"
             />
          </div>
          <div className="flex-1 min-w-0 space-y-3 pt-1">
             <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                   <h3 className="font-black text-lg truncate text-foreground pr-4">{product.name}</h3>
                   <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{product.unit || "Sản phẩm"}</span>
                </div>
                <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={onEdit} className="size-9 rounded-full hover:bg-primary/20 hover:text-primary transition-all">
                         <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={onDelete} className="size-9 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all">
                         <Trash2 className="size-4" />
                      </Button>
                   </div>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   {finalPrice < product.price && (
                     <span className="text-[10px] text-muted-foreground line-through font-bold tracking-tight">{formatPrice(product.price)}</span>
                   )}
                   <span className="text-xl font-black text-rose-500">{formatPrice(finalPrice || 0)}</span>
                </div>
                <div className="flex-1" />
                {offPercentage > 0 && (
                  <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-2xl px-3 py-1 font-black text-xs">
                    -{offPercentage}%
                  </Badge>
                )}
             </div>

             {item.gift_product && (
                <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-primary/5 text-primary text-[9px] font-black group-hover:bg-primary/10 transition-colors">
                   <Gift className="size-3.5 fill-primary/20" />
                   <span className="uppercase tracking-[0.1em] truncate">Tặng: {item.gift_product.name}</span>
                </div>
             )}
          </div>
       </div>
    </Card>
  );
}


