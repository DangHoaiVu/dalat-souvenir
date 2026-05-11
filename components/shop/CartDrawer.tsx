"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { cartProductId } from "@/lib/cart-product-id";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Checkbox } from "@/components/ui/checkbox";
import GlassModal from "@/components/ui/GlassModal";
import GlassButton from "@/components/ui/GlassButton";
import { toast } from "sonner";
import CheckoutModal from "./CheckoutModal";

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function CartDrawer() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const {
    isOpen,
    items,
    selectedItemIds,
    closeCart,
    updateQuantity,
    removeItem,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    removeSelectedItems,
    clearCart,
  } = useCartStore();

  const selectedItems = items.filter(item => selectedItemIds.includes(cartProductId(item.product)));
  const selectedTotalPrice = selectedItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);

  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      deselectAllItems();
    } else {
      selectAllItems();
    }
  };

  const handleCheckoutSuccess = () => {
    removeSelectedItems();
    setIsCheckoutOpen(false);
    closeCart();
    router.refresh();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={closeCart}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground drop-shadow-sm">
              Giỏ hàng của bạn
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-serif italic drop-shadow-sm">
              {user?.name ? `Xin chào, ${user.name}` : "Hãy để những món đồ này lưu giữ kỷ niệm cho bạn"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[60vh] md:h-[500px]">
        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="size-24 rounded-full border border-white/30 flex items-center justify-center mb-6 backdrop-blur-md">
                <ShoppingCart className="size-10 text-primary/80" />
              </div>
              <p className="text-xl font-serif font-bold text-foreground">Giỏ hàng trống</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                Bạn chưa chọn sản phẩm nào. Hãy khám phá các món quà đặc biệt của chúng tôi nhé.
              </p>
              <div className="mt-8">
                <GlassButton
                  variant="primary"
                  onClick={() => {
                    closeCart();
                    router.push("/products");
                  }}
                >
                  Khám phá ngay
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6 flex items-center gap-3 p-3 rounded-xl border border-white/20 shadow-sm">
                <Checkbox 
                  checked={isAllSelected} 
                  onCheckedChange={handleToggleAll}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-white/40"
                />
                <span className="text-sm font-bold text-foreground">Chọn tất cả ({items.length} sản phẩm)</span>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const pid = cartProductId(item.product);
                  const isSelected = selectedItemIds.includes(pid);
                  
                  return (
                    <div key={pid} className="group relative flex gap-4 rounded-2xl p-4 border border-white/20 shadow-sm hover:shadow-md hover:border-white/40 transition-all bg-white/5">
                      <div className="flex items-center pt-8">
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleItemSelection(pid)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-white/40"
                        />
                      </div>
                      <div className="relative size-24 rounded-xl overflow-hidden shrink-0 border border-white/30 shadow-sm bg-white/10">
                        <Image
                          src={item.product.images?.[0] ?? item.product.image ?? "https://picsum.photos/seed/placeholder/200/200"}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-1 flex-col py-1">
                        <div className="flex justify-between items-start gap-2">
                          <Link href={`/products/${item.product.slug}`} onClick={closeCart} className="line-clamp-2 text-base font-bold text-foreground hover:text-primary transition-colors pr-6 drop-shadow-sm">
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() => removeItem(pid)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-md"
                            aria-label="Xóa sản phẩm"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        
                        <p className="text-sm font-bold text-secondary mt-1 drop-shadow-sm">
                          {formatPrice(item.product.price)}
                        </p>
                        
                        <div className="mt-auto flex items-center gap-4">
                          <div className="flex items-center rounded-full border border-white/20 bg-white/10 p-0.5 shadow-sm">
                            <button
                              onClick={() => updateQuantity(pid, item.quantity - 1)}
                              className="flex size-7 items-center justify-center rounded-full text-foreground hover:bg-white/20 active:scale-95 transition-all font-medium disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(pid, item.quantity + 1)}
                              className="flex size-7 items-center justify-center rounded-full text-foreground hover:bg-white/20 active:scale-95 transition-all font-medium disabled:opacity-50"
                              disabled={item.quantity >= item.product.stock}
                            >
                              +
                            </button>
                          </div>
                          {item.quantity >= item.product.stock && (
                            <span className="text-[10px] uppercase font-bold text-secondary tracking-wider border border-white/20 px-2 py-1 rounded-full">Tối đa kho</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Checkout Summary Column */}
        <div className="md:w-[320px] border-t md:border-t-0 md:border-l border-white/20 p-6 md:p-8 flex flex-col justify-between bg-white/5">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground mb-6 pb-4 border-b border-white/20 drop-shadow-sm">Tóm tắt đơn hàng</h3>
            
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex justify-between items-center border border-white/10 px-4 py-3 rounded-xl shadow-sm">
                <span>Số lượng:</span>
                <span className="font-bold text-foreground">{selectedCount} món</span>
              </div>
              <div className="flex justify-between items-center border border-white/10 px-4 py-3 rounded-xl shadow-sm">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-secondary">Miễn phí</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20 flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-foreground drop-shadow-sm">Tổng cộng:</span>
                <span className="text-3xl font-serif font-bold text-primary drop-shadow-sm">
                  {formatPrice(selectedTotalPrice)}
                </span>
              </div>
              <p className="text-[10px] text-right text-muted-foreground uppercase tracking-widest font-bold drop-shadow-sm">Đã bao gồm VAT</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <GlassButton
              variant="primary"
              className="w-full"
              onClick={() => setIsCheckoutOpen(true)}
              disabled={selectedItems.length === 0}
            >
              Thanh toán ngay
            </GlassButton>
            <GlassButton
              variant="secondary"
              className="w-full"
              onClick={closeCart}
            >
              Tiếp tục mua sắm
            </GlassButton>
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        items={selectedItems} 
        totalPrice={selectedTotalPrice} 
        onSuccess={handleCheckoutSuccess}
      />
    </GlassModal>
  );
}
