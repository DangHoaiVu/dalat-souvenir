"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  Check, 
  Trash2, 
  Gift, 
  Percent, 
  CircleDollarSign,
  Info,
  X,
  Package,
  Plus,
  Pencil
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Product, Promotion } from "@/types";
import ProductSelectionDialog from "./ProductSelectionDialog";

interface PromotionItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion;
  item?: any | null; // For editing
  onSave: () => void;
}

export default function PromotionItemSheet({
  open,
  onOpenChange,
  promotion,
  item,
  onSave,
}: PromotionItemSheetProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [useFixedPrice, setUseFixedPrice] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [giftProduct, setGiftProduct] = useState<Product | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);

  useEffect(() => {
    if (!item) {
      setSelectedProducts([]);
      setUseFixedPrice(promotion.fixed_price != null);
      setDiscountPercentage("");
      setGiftProduct(null);
      return;
    }

    const prod = item.product;
    setSelectedProducts([prod]);
    
    const initialUseFixedPrice = !item.discount_percentage;
    const canUseFixedPrice = promotion.fixed_price != null && prod.price >= promotion.fixed_price;
    
    setUseFixedPrice(initialUseFixedPrice && canUseFixedPrice);
    setDiscountPercentage(String(item.discount_percentage || ""));
    setGiftProduct(item.gift_product || null);
  }, [item, open, promotion]);

  // Auto-clear gift if rules are violated
  useEffect(() => {
    if (!giftProduct || selectedProducts.length === 0) return;
    
    const minProductPrice = Math.min(...selectedProducts.map(p => p.price));
    const isTooExpensive = giftProduct.price >= minProductPrice;
    const isOverLimit = giftProduct.price > 200000;
    const needsSpecialGift = selectedProducts.length >= 2 && giftProduct.is_for_sale !== false;
    
    if (isTooExpensive || isOverLimit || needsSpecialGift) {
      setGiftProduct(null);
      toast.info("Quà tặng đã được gỡ bỏ do không phù hợp với quy tắc mới");
    }
  }, [selectedProducts, giftProduct]);

  const save = async () => {
    if (selectedProducts.length === 0) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/promotions/${promotion.promotion_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: selectedProducts.map(p => p.product_id),
          discount_percentage: useFixedPrice ? null : Number(discountPercentage),
          gift_product_id: giftProduct?.product_id || null,
          use_fixed_price: useFixedPrice,
        }),
      });

      if (res.ok) {
        toast.success(item ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm vào khuyến mãi");
        onSave();
        onOpenChange(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "Lỗi khi lưu sản phẩm");
      }
    } catch (e) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsSaving(false);
    }
  };

  const calculatedPrice = () => {
    if (selectedProducts.length === 0) return 0;
    const basePrice = selectedProducts[0].price;
    if (useFixedPrice && promotion.fixed_price) return promotion.fixed_price;
    const pct = Number(discountPercentage) || 0;
    return Math.round(basePrice * (1 - pct / 100));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[500px] bg-white/40 dark:bg-zinc-950/40 border-l border-border p-0 overflow-hidden backdrop-blur-3xl shadow-2xl"
      >
        <div className="flex flex-col h-full">
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="px-6 pt-8 pb-4 relative z-10 space-y-4">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                {item ? (
                  <><Pencil className="size-6 text-primary" /> <span>Chỉnh sửa cấu hình</span></>
                ) : (
                  <><Plus className="size-6 text-primary" /> <span>Thêm sản phẩm áp dụng</span></>
                )}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                Thiết lập mức giảm giá và quà tặng cho sản phẩm trong chương trình này.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-32 custom-scrollbar">
            {/* Product Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                 <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sản phẩm</Label>
                 {!item && (
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowProductPicker(true)}
                    className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold px-4"
                   >
                     {selectedProducts.length > 0 ? "Thay đổi" : "CHỌN"}
                   </Button>
                 )}
              </div>
              
              {selectedProducts.length > 0 ? (
                <div className="space-y-2">
                  {selectedProducts.map(product => (
                    <div key={product.product_id} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="size-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                        <img src={product.image} alt={product.name} className="size-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate">{product.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">Giá gốc: {formatPrice(product.price)}</p>
                      </div>
                      {!item && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedProducts(prev => prev.filter(p => p.product_id !== product.product_id))}
                          className="size-8 rounded-full hover:bg-destructive/10 text-destructive"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {selectedProducts.length > 1 && !item && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2">
                       <Check className="size-4 text-primary" />
                       <span className="text-[10px] font-bold text-primary uppercase">Đã chọn {selectedProducts.length} sản phẩm để cấu hình chung</span>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => !item && setShowProductPicker(true)}
                  className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <Package className="size-10 text-muted-foreground group-hover:text-primary/50 transition-colors mb-2" />
                  <p className="text-sm text-muted-foreground italic font-medium">Chưa có sản phẩm nào được chọn</p>
                </div>
              )}
            </section>

            {/* Price Configuration */}
            <section className="space-y-6 pt-4 border-t border-white/5">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cấu hình giá</Label>
              
              <div className="space-y-4">
                {promotion.fixed_price != null && (
                    <div className={cn(
                      "flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-border backdrop-blur-md transition-all group",
                      selectedProducts.some(p => p.price < (promotion.fixed_price || 0)) && "opacity-50 grayscale cursor-not-allowed"
                    )}>
                      <div className="flex items-center gap-3">
                         <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <CircleDollarSign className="size-5" />
                         </div>
                         <div className="space-y-0.5">
                            <Label className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-primary transition-colors">
                                Áp dụng đồng giá ({formatPrice(promotion.fixed_price)})
                            </Label>
                            {selectedProducts.some(p => p.price < (promotion.fixed_price || 0)) ? (
                              <p className="text-[10px] text-rose-500 font-bold">Có sản phẩm giá gốc thấp hơn giá đồng giá</p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Sử dụng giá cố định của chương trình</p>
                            )}
                         </div>
                      </div>
                      <Checkbox 
                        id="fixed-price" 
                        checked={useFixedPrice}
                        disabled={selectedProducts.some(p => p.price < (promotion.fixed_price || 0))}
                      onCheckedChange={(val) => {
                        setUseFixedPrice(!!val);
                        if (val) setDiscountPercentage("");
                      }}
                      className="size-5 rounded-md border-border data-[state=checked]:bg-primary"
                    />
                  </div>
                )}

                <div className={cn(
                  "space-y-3 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-border backdrop-blur-md transition-all",
                  !useFixedPrice && "border-primary/20 bg-primary/[0.02]"
                )}>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <Percent className="size-5" />
                     </div>
                     <Label className="text-sm font-bold">Giảm giá theo %</Label>
                  </div>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="0"
                      disabled={useFixedPrice}
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="h-11 pl-10 bg-white/50 dark:bg-white/5 border-border rounded-xl focus:ring-rose-500/20"
                    />
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Nhập 0-100 để giảm theo phần trăm giá gốc.</p>
                </div>
              </div>
            </section>

            {/* Warning Section */}
            {selectedProducts.length > 0 && !(useFixedPrice || (discountPercentage && Number(discountPercentage) > 0) || giftProduct) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                 <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="size-4 text-amber-500" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Lưu ý cấu hình</p>
                    <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium">
                      Sản phẩm đang chọn chưa có mức giảm giá, đồng giá hay quà tặng kèm.
                    </p>
                 </div>
              </div>
            )}

            {/* Preview Section */}
            <section className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Giá sau KM:</span>
               <div className="text-right">
                  {selectedProducts.length > 0 && (
                    <span className="text-[10px] text-muted-foreground line-through block font-medium">{formatPrice(selectedProducts[0].price)}</span>
                  )}
                  <span className="text-2xl font-black text-rose-500">{formatPrice(calculatedPrice())}</span>
               </div>
            </section>

            {/* Gift Section */}
            <section className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quà tặng kèm (Tùy chọn)</Label>
                 <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowGiftPicker(true)}
                  className="rounded-xl border-border text-primary text-xs font-bold px-4 hover:border-primary/20"
                 >
                   {giftProduct ? "Thay đổi" : "CHỌN QUÀ"}
                 </Button>
              </div>

              {giftProduct ? (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 border border-border group">
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                     <Gift className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs truncate text-primary">{giftProduct.name}</h4>
                    <p className="text-[10px] text-muted-foreground italic">Qùa tặng đính kèm đơn hàng</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setGiftProduct(null)} className="size-8 rounded-full hover:bg-destructive/10">
                     <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-border text-muted-foreground italic text-xs font-medium bg-secondary/30">
                   <Gift className="size-5 opacity-30" />
                   Không có quà tặng kèm
                </div>
              )}
            </section>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background/90 to-transparent pt-12 pointer-events-auto">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-2xl border-border hover:bg-secondary font-semibold"
              >
                Hủy
              </Button>
              <Button 
                onClick={save} 
                disabled={
                  isSaving || 
                  selectedProducts.length === 0 || 
                  !(useFixedPrice || (discountPercentage && Number(discountPercentage) > 0) || giftProduct) ||
                  (useFixedPrice && selectedProducts.some(p => p.price < (promotion.fixed_price || 0)))
                }
                className="flex-[2] h-12 rounded-2xl font-bold bg-primary text-white hover:bg-primary-dark shadow-primary/20"
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 size-5 animate-spin" /> Đang lưu...</>
                ) : (
                  <>
                    {item ? <Check className="mr-2 size-5" /> : <Plus className="mr-2 size-5" />}
                    {item ? "Lưu thay đổi" : "Lưu vào danh mục"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>

      <ProductSelectionDialog 
        open={showProductPicker} 
        onOpenChange={setShowProductPicker} 
        multiSelect={!item}
        onlyForSale={true}
        title="Chọn sản phẩm áp dụng"
        excludeIds={promotion.items ? (promotion.items as any[]).map(i => i.product_id) : []}
        onSelect={(p) => {
          setSelectedProducts([p]);
          setShowProductPicker(false);
        }}
        onSelectMultiple={(prods) => {
          setSelectedProducts(prods);
          setShowProductPicker(false);
        }}
      />

      <ProductSelectionDialog 
        open={showGiftPicker} 
        onOpenChange={setShowGiftPicker} 
        title="Chọn quà tặng kèm"
        maxPrice={selectedProducts.length > 0 ? Math.min(200000, ...selectedProducts.map(p => p.price)) - 1 : 200000}
        onlyGifts={selectedProducts.length >= 2}
        onSelect={(p) => {
          setGiftProduct(p);
          setShowGiftPicker(false);
        }}
        excludeIds={selectedProducts.map(p => p.product_id)}
      />
    </Sheet>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
