"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  X, 
  Check, 
  Package,
  Loader2,
  Plus
} from "lucide-react";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (product: Product) => void;
  onSelectMultiple?: (products: Product[]) => void;
  excludeIds?: string[];
  multiSelect?: boolean;
  maxPrice?: number;
  onlyGifts?: boolean;
  onlyForSale?: boolean;
  title?: string;
}

export default function ProductSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  onSelectMultiple,
  excludeIds = [],
  multiSelect = false,
  maxPrice,
  onlyGifts,
  onlyForSale,
  title,
}: ProductSelectionDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProducts();
      setSelectedIds([]); // Reset selection on open
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isExcluded = excludeIds.includes(p.product_id);
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesMaxPrice = maxPrice == null || p.price <= maxPrice;
      const matchesOnlyGifts = onlyGifts == null || !onlyGifts || p.is_for_sale === false;
      const matchesOnlyForSale = onlyForSale == null || !onlyForSale || p.is_for_sale !== false;
      
      return !isExcluded && matchesSearch && matchesMaxPrice && matchesOnlyGifts && matchesOnlyForSale;
    });
  }, [products, search, excludeIds, maxPrice, onlyGifts, onlyForSale]);

  const handleApply = () => {
    if (multiSelect) {
      const selected = products.filter(p => selectedIds.includes(p.product_id));
      onSelectMultiple?.(selected);
    }
    onOpenChange(false);
  };

  const toggleProduct = (product: Product) => {
    if (multiSelect) {
      setSelectedIds(prev => 
        prev.includes(product.product_id)
          ? prev.filter(id => id !== product.product_id)
          : [...prev, product.product_id]
      );
    } else {
      onSelect?.(product);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border p-0 overflow-hidden backdrop-blur-2xl rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-black flex items-center gap-3 tracking-tighter">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Package className="size-5 text-primary" />
             </div>
             {title || "Chọn sản phẩm"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium ml-13">
             Tìm kiếm và chọn sản phẩm để áp dụng vào chương trình khuyến mãi.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 px-8 border-b border-border bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-background border-border rounded-2xl focus:ring-primary/20 font-medium"
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-4 py-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground italic font-medium">Đang tải danh mục sản phẩm...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-1">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.product_id);
                return (
                  <button
                    key={product.product_id}
                    onClick={() => toggleProduct(product)}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl hover:bg-muted transition-all text-left group border border-transparent",
                      isSelected && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border group-hover:border-primary/30 transition-colors">
                       <Image src={product.image || "/placeholder.png"} alt={product.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className={cn(
                         "font-bold text-sm truncate group-hover:text-primary transition-colors",
                         isSelected && "text-primary"
                       )}>{product.name}</h4>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{product.category?.name || "Sản phẩm"}</p>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-black text-foreground">{formatPrice(product.price)}</span>
                          {product.stock <= 0 && (
                            <Badge variant="destructive" className="text-[8px] h-4 px-1 font-bold uppercase">Hết hàng</Badge>
                          )}
                          {!product.is_for_sale && (
                            <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 px-1 font-bold uppercase">Quà tặng</Badge>
                          )}
                       </div>
                    </div>
                    
                    {multiSelect ? (
                      <div className={cn(
                        "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary border-primary" : "border-border bg-transparent"
                      )}>
                        {isSelected && <Check className="size-4 text-white" />}
                      </div>
                    ) : (
                      <Plus className="size-5 text-border group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-20 text-center space-y-2">
               <X className="size-10 text-muted-foreground mx-auto" />
               <p className="text-muted-foreground font-bold italic tracking-tight">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex items-center justify-between bg-muted/20">
          {multiSelect && (
            <span className="text-xs font-bold text-muted-foreground ml-2">
              Đã chọn <span className="text-primary">{selectedIds.length}</span> sản phẩm
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl border-border font-bold h-11">
              Hủy bỏ
            </Button>
            {multiSelect && (
              <Button 
                onClick={handleApply} 
                disabled={selectedIds.length === 0}
                className="rounded-2xl px-8 font-black bg-primary text-white h-11 shadow-lg shadow-primary/20"
              >
                Xác nhận
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
