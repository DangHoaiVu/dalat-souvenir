"use client";

import { Tag, Plus, Search, Pencil, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Promotion } from "@/types";
import PromotionSheet from "@/components/admin/PromotionSheet";

const formatPrice = (value: number) => `${(value ?? 0).toLocaleString("vi-VN")}đ`;

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Sheet states
  const [openSheet, setOpenSheet] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/promotions");
      const data = await res.json();
      if (res.ok) {
        setPromotions(data);
      } else {
        toast.error("Lỗi khi tải danh sách khuyến mãi");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const onSave = (saved: Promotion) => {
    setPromotions((prev) => {
      const exists = prev.some((p) => p.promotion_id === saved.promotion_id);
      if (exists) {
        return prev.map((p) => p.promotion_id === saved.promotion_id ? saved : p);
      }
      return [saved, ...prev];
    });
    toast.success(editingPromotion ? "Đã cập nhật khuyến mãi" : "Đã tạo khuyến mãi mới");
  };

  const filteredPromotions = useMemo(() => {
    return promotions
      .filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        // Active first
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        
        // Then earliest start date first
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
  }, [promotions, search]);

  const getStatus = (promo: Promotion) => {
    if (promo.is_active) {
      return { label: "Đang hoạt động", color: "bg-green-500/10 text-green-500" };
    }
    return { label: "Sắp hoạt động", color: "bg-gray-500/10 text-gray-500" };
  };

  return (
    <div className="space-y-6">
      <PromotionSheet 
        open={openSheet} 
        onOpenChange={setOpenSheet} 
        promotion={editingPromotion} 
        onSave={onSave} 
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý khuyến mãi</h1>
          <p className="text-muted-foreground font-medium">
            Tạo và quản lý các chương trình khuyến mãi, ưu đãi cho sản phẩm.
          </p>
        </div>
        <Button 
          className="bg-primary text-white hover:bg-primary/90 rounded-full px-6"
          onClick={() => {
            setEditingPromotion(null);
            setOpenSheet(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm khuyến mãi
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khuyến mãi..."
            className="pl-8 bg-background border-none ring-1 ring-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex h-60 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPromotions.length > 0 ? (
          filteredPromotions.map((promo) => {
            const status = getStatus(promo);
            return (
              <div
                key={promo.promotion_id}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-xl transition-all hover:shadow-2xl hover:translate-y-[-2px] cursor-pointer"
                onClick={() => router.push(`/admin/promotions/${promo.promotion_id}`)}
              >
                {/* Banner Image */}
                <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
                  <img
                    src={promo.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"}
                    alt={promo.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                        {promo.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={`${status.color} border-none font-bold py-0.5 px-2.5`}>
                          {status.label}
                        </Badge>
                        {promo.fixed_price && (
                          <span className="text-xs font-medium text-muted-foreground">
                            Đồng giá: {formatPrice(promo.fixed_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      {new Date(promo.start_date).toLocaleDateString('vi-VN')} - {new Date(promo.end_date).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="flex items-center gap-1">
                      {status.label !== "Đang hoạt động" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPromotion(promo);
                              setOpenSheet(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="h-8 w-8 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) {
                                try {
                                  const res = await fetch(`/api/promotions?id=${promo.promotion_id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    setPromotions(prev => prev.filter(p => p.promotion_id !== promo.promotion_id));
                                    toast.success("Đã xóa khuyến mãi");
                                  } else {
                                    toast.error("Không thể xóa khuyến mãi");
                                  }
                                } catch (e) {
                                  toast.error("Lỗi khi xóa khuyến mãi");
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full h-60 flex flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground">
            <Tag className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-lg font-medium">Không tìm thấy khuyến mãi nào</p>
            <p className="text-sm">Thử thay đổi từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  );
}
