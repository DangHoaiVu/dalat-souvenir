"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import CheckoutModal from "@/components/shop/CheckoutModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import GlassModal from "@/components/ui/GlassModal";
import { cartProductId } from "@/lib/cart-product-id";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function CartDrawer() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
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
  } = useCartStore();

  const selectedItems = items.filter((item) => selectedItemIds.includes(cartProductId(item.product)));
  const selectedTotalPrice = selectedItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

  useEffect(() => {
    if (!isOpen || isLoggedIn) return;
    closeCart();
    router.push("/login");
  }, [closeCart, isLoggedIn, isOpen, router]);

  if (isOpen && !isLoggedIn) return null;

  const handleToggleAll = () => {
    if (isAllSelected) deselectAllItems();
    else selectAllItems();
  };

  const handleCheckoutSuccess = () => {
    removeSelectedItems();
    setIsCheckoutOpen(false);
    closeCart();
    router.refresh();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={closeCart}>
      <div className="border-b border-[--color-border] px-4 py-4 pr-14 sm:px-6 sm:py-5">
        <h2 className="text-2xl font-bold text-primary">Giỏ hàng của bạn</h2>
        <p className="mt-1 text-sm text-secondary">
          {user?.name ? `Xin chào, ${user.name}` : "Chọn những món quà Đà Lạt bạn muốn giữ lại."}
        </p>
      </div>

      <div className="flex max-h-[82svh] flex-col md:h-[560px] md:max-h-[76vh] md:flex-row">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent-light text-accent">
                <ShoppingCart className="size-9" />
              </div>
              <p className="text-xl font-bold text-primary">Giỏ hàng trống</p>
              <p className="mt-2 max-w-[280px] text-sm text-secondary">
                Bạn chưa chọn sản phẩm nào. Hãy khám phá các món quà đặc biệt của chúng tôi.
              </p>
              <Button
                className="mt-8"
                onClick={() => {
                  closeCart();
                  router.push("/products");
                }}
              >
                Khám phá ngay
              </Button>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3 rounded-lg border border-[--color-border] bg-surface-muted p-3">
                <Checkbox checked={isAllSelected} onCheckedChange={handleToggleAll} />
                <span className="text-sm font-semibold text-primary">Chọn tất cả ({items.length} sản phẩm)</span>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const pid = cartProductId(item.product);
                  const isSelected = selectedItemIds.includes(pid);

                  return (
                    <div
                      key={pid}
                      className="group relative flex gap-3 rounded-lg border border-[--color-border] bg-surface p-3 shadow-card transition-all duration-200 hover:border-[--color-border-hover] hover:shadow-card-hover sm:gap-4 sm:p-4"
                    >
                      <div className="flex items-center pt-8">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(pid)} />
                      </div>
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:size-24">
                        <Image
                          src={item.product.images?.[0] ?? item.product.image ?? "https://picsum.photos/seed/placeholder/200/200"}
                          alt={item.product.name}
                          fill
                          sizes="96px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          href={`/products/${item.product.product_id}`}
                          onClick={closeCart}
                          className="line-clamp-2 pr-8 text-sm font-bold text-primary transition-colors hover:text-accent sm:text-base"
                        >
                          {item.product.name}
                        </Link>
                        <p className="mt-1 text-sm font-bold text-accent">{formatPrice(item.product.price)}</p>

                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 sm:gap-3 sm:pt-4">
                          <div className="flex items-center rounded-md border border-[--color-border] bg-surface-muted p-0.5">
                            <button
                              onClick={() => updateQuantity(pid, item.quantity - 1)}
                              className="flex size-8 items-center justify-center rounded text-primary transition hover:bg-surface"
                              disabled={item.quantity <= 1}
                              aria-label="Giảm số lượng"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-bold text-primary">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(pid, item.quantity + 1)}
                              className="flex size-8 items-center justify-center rounded text-primary transition hover:bg-surface"
                              disabled={item.quantity >= item.product.stock}
                              aria-label="Tăng số lượng"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          {item.quantity >= item.product.stock && (
                            <span className="rounded-full bg-warning-light px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-warning-text">
                              Tối đa kho
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(pid)}
                        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-tertiary transition hover:bg-error-light hover:text-error"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between border-t border-[--color-border] bg-surface-muted p-4 md:w-[320px] md:border-l md:border-t-0 md:p-6">
          <div>
            <h3 className="mb-5 border-b border-[--color-border] pb-4 text-lg font-bold text-primary">Tóm tắt đơn hàng</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-lg border border-[--color-border] bg-surface px-4 py-3">
                <span className="text-secondary">Số lượng</span>
                <span className="font-bold text-primary">{selectedCount} món</span>
              </div>
              <div className="flex justify-between rounded-lg border border-[--color-border] bg-surface px-4 py-3">
                <span className="text-secondary">Phí vận chuyển</span>
                <span className="font-bold text-accent">Miễn phí</span>
              </div>
            </div>

            <div className="mt-6 border-t border-[--color-border] pt-5">
              <div className="flex items-end justify-between">
                <span className="text-sm font-bold text-primary">Tổng cộng</span>
                <span className="text-2xl font-bold text-accent">{formatPrice(selectedTotalPrice)}</span>
              </div>
              <p className="mt-1 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-tertiary">Đã bao gồm VAT</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={() => setIsCheckoutOpen(true)} disabled={selectedItems.length === 0}>
              Thanh toán ngay
            </Button>
            <Button variant="outline" className="w-full" onClick={closeCart}>
              Tiếp tục mua sắm
            </Button>
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
