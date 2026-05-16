"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { cartProductId } from "@/lib/cart-product-id";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/auth-fetch";
import { supabase } from "@/lib/supabaseClient";
import { mapProductRow, type SupabaseProductRow } from "@/lib/map-supabase-product";
import type { Product } from "@/types";

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

interface CartPageClientProps {
  initialRecommendations: Product[];
}

interface GroupedOrder {
  order_id: string;
  created_at: string;
  status: string;
  estimated_arrival_at: string | null;
  items: Product[];
}

const ONE_DAY_SECONDS = 24 * 60 * 60;

function formatEtaCountdown(estimatedArrivalAt: string | null, nowMs: number): string | null {
  if (!estimatedArrivalAt) return null;

  const etaMs = new Date(estimatedArrivalAt).getTime();
  if (Number.isNaN(etaMs)) return null;

  const remainingSeconds = Math.floor((etaMs - nowMs) / 1000);
  if (remainingSeconds <= 0) return "Đã đến nơi";

  if (remainingSeconds < ONE_DAY_SECONDS) {
    const hours = Math.floor(remainingSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(remainingSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  const remainingDays = Math.ceil(remainingSeconds / ONE_DAY_SECONDS);
  return `Còn ${remainingDays} ngày`;
}

export default function CartPageClient({ initialRecommendations }: CartPageClientProps) {
  void initialRecommendations;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [purchasedOrders, setPurchasedOrders] = useState<GroupedOrder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login?redirect=/cart");
    }
  }, [isInitialized, isLoggedIn, mounted, router]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  // Fetch real purchase history if logged in
  useEffect(() => {
    async function fetchHistory() {
      if (!isInitialized || !mounted) return;
      
      if (!isLoggedIn || !user?.id) {
        if (isInitialized && !isLoggedIn) {
          setPurchasedOrders([]);
        }
        return;
      }




      try {
        setIsLoadingHistory(true);
        // 1. Fetch user orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("order_id, created_at, status, estimated_arrival_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (ordersError || !orders || orders.length === 0) {
          setPurchasedOrders([]);
          return;
        }

        const orderIds = orders.map(o => o.order_id);

        // 2. Fetch order items for these orders
        const { data: details, error: detailsError } = await supabase
          .from("order_items")
          .select("order_id, product_id")
          .in("order_id", orderIds);

        if (detailsError || !details || details.length === 0) {
          setPurchasedOrders([]);
          return;
        }

        const productIds = Array.from(new Set(details.map(d => d.product_id)));

        // 3. Fetch product details
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*, category:categories(name)")
          .in("product_id", productIds);

        if (productsError || !productsData || productsData.length === 0) {
          setPurchasedOrders([]);
          return;
        }

        const prodMap: Record<string, Product> = {};
        for (const row of productsData || []) {
          const productId = String((row as { product_id?: unknown }).product_id ?? "");
          if (!productId) continue;
          prodMap[productId] = mapProductRow(row as SupabaseProductRow);
        }

        // 4. Assemble into Grouped Orders
        const grouped: GroupedOrder[] = orders.map(order => {
          const itemIds = details
            .filter(d => d.order_id === order.order_id)
            .map(d => d.product_id);
          
          const items = itemIds
            .map(id => prodMap[id])
            .filter(Boolean);

          return {
            order_id: order.order_id,
            created_at: order.created_at,
            status: String(order.status ?? "pending"),
            estimated_arrival_at: order.estimated_arrival_at ?? null,
            items: items as Product[]
          };
        }).filter(o => o.items.length > 0);

        setPurchasedOrders(grouped);
      } catch (err) {
        console.error("Error fetching purchase history:", err);
        setPurchasedOrders([]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [isLoggedIn, user?.id, isInitialized, refreshKey, mounted]);





  
  const {
    items,
    selectedItemIds,
    updateQuantity,
    removeItem,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    removeSelectedItems,
  } = useCartStore();


  const selectedItems = items.filter(item => selectedItemIds.includes(cartProductId(item.product)));
  const selectedTotalPrice = selectedItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);

  const discount = couponApplied ? Math.round(selectedTotalPrice * 0.1) : 0;
  const finalTotal = selectedTotalPrice - discount;

  const handleOrderNow = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare items for the existing checkout route
      const orderItems = selectedItems.map(item => ({
        productId: item.product.product_id,
        amount: item.quantity,
        priceAtPurchase: item.product.price,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image || ""
      }));

      // Attempt to get accurate coordinates
      let latitude: number | null = null;
      let longitude: number | null = null;
      let profileAddress: string | null = null;

      if (isLoggedIn && user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("address, latitude, longitude")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          latitude = profile.latitude ? Number(profile.latitude) : null;
          longitude = profile.longitude ? Number(profile.longitude) : null;
          profileAddress = profile.address;
        }
      }

      const res = await authFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: orderItems,
          customerInfo: { address: profileAddress, name: user?.name, phone: user?.phone, paymentMethod: "cod" },
          couponCode: couponApplied ? "DALATSPECIAL" : "",
          latitude,
          longitude
        })
      });


      const data = await res.json().catch(() => ({ error: "Server returned non-JSON response" }));

      if (!res.ok) {
        alert(data.error || data.details || "Đặt hàng thất bại. Vui lòng thử lại.");
        return;
      }


      // Success!
      removeSelectedItems();
      setRefreshKey(prev => prev + 1);
      alert("Đặt hàng thành công!");
      
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };



  const canApplyCoupon = useMemo(() => coupon.trim().toUpperCase() === "DALATSPECIAL", [coupon]);

  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      deselectAllItems();
    } else {
      selectAllItems();
    }
  };

  const handleConfirmReceived = async (orderId: string) => {
    if (!orderId || confirmingOrderId) return;

    try {
      setConfirmingOrderId(orderId);
      const { error } = await supabase.rpc("complete_order_and_deduct_stock", {
        p_order_id: orderId,
      });

      if (error) {
        throw error;
      }

      alert("Đã xác nhận nhận hàng thành công!");
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Confirm received failed:", err);
      alert("Không thể xác nhận đơn hàng. Vui lòng thử lại.");
    } finally {
      setConfirmingOrderId(null);
    }
  };


  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className={cn("grid gap-8 transition-all", items.length > 0 ? "lg:grid-cols-[1fr_350px]" : "grid-cols-1")}>
        <section>
          {items.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase tracking-tight">Giỏ hàng ({items.length})</h1>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm font-medium text-destructive hover:underline opacity-80 hover:opacity-100 transition-opacity"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3 px-1">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={handleToggleAll}
                />
                <span className="text-sm font-medium">Chọn tất cả ({items.length}) sản phẩm</span>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const pid = cartProductId(item.product);
                  const isSelected = selectedItemIds.includes(pid);

                  return (
                    <div key={pid} className={cn(
                      "rounded-2xl border p-4 transition-all duration-200",
                      isSelected ? "bg-accent/5 overflow-hidden border-primary/20 shadow-sm" : "bg-card border-border shadow-none"
                    )}>
                      <div className="flex gap-4">
                        <div className="flex items-center pt-1">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(pid)}
                          />
                        </div>
                        <img
                          src={item.product.images?.[0] ?? item.product.image ?? ""}
                          alt={item.product.name}
                          className="size-24 rounded-xl object-cover shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="line-clamp-2 font-bold text-lg leading-tight">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{item.product.category?.name ?? "Lưu niệm Đà Lạt"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(pid)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-lg border border-border/50">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 rounded-md hover:bg-background shadow-xs active:scale-95 transition-all"
                                onClick={() => updateQuantity(pid, item.quantity - 1)}
                                aria-label="Giảm số lượng"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 rounded-md hover:bg-background shadow-xs active:scale-95 transition-all"
                                onClick={() => updateQuantity(pid, item.quantity + 1)}
                                aria-label="Tăng số lượng"
                              >
                                +
                              </Button>
                            </div>
                            <p className="font-black text-primary text-lg">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center py-12">
              <ShoppingCart className="mb-4 size-16 text-muted-foreground/40" />
              <h1 className="text-2xl font-semibold">Giỏ hàng của bạn đang trống</h1>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
                Hãy khám phá những món lưu niệm Đà Lạt để bắt đầu mua sắm.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                Khám phá sản phẩm
              </Link>
            </div>
          )}





        </section>

        {items.length > 0 && (
          <aside className="h-fit space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-medium text-sm">Đã chọn ({selectedCount} sản phẩm)</span>
                <span className="font-bold text-sm text-foreground">{formatPrice(selectedTotalPrice)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-600 font-bold text-sm mb-4">
                  <span>Giảm giá (10%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              
              <div className="my-6 border-t border-dashed border-border"></div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">Tổng cộng</span>
                <span className="text-2xl font-black text-primary">{formatPrice(finalTotal)}</span>
              </div>


              <div className="mt-6 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-widest pl-1">Mã ưu đãi</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã..."
                    value={coupon}
                    className="rounded-xl h-10"
                    onChange={(event) => setCoupon(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="rounded-xl px-4 font-bold border-2"
                    onClick={() => setCouponApplied(canApplyCoupon)}
                  >
                    Áp dụng
                  </Button>
                </div>
                {couponApplied && (
                  <p className="mt-2 text-xs font-medium text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-2">
                    <span className="block size-1.5 rounded-full bg-green-500"></span>
                    Đã áp dụng mã DALATSPECIAL
                  </p>
                )}
              </div>

              <Button
                className="mt-8 h-12 w-full rounded-xl bg-primary text-white font-black uppercase tracking-tight shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
                onClick={handleOrderNow}
                disabled={selectedItems.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt hàng ngay"}
              </Button>

            </div>
          </aside>
        )}


      </div>

      {/* Purchased History Section - Moved Outside Grid for Stability */}
      {mounted && isLoggedIn && (
        <div className="mt-20 pt-12 border-t border-dashed border-border/60">
          <div className="flex items-center justify-between mb-10 group">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black uppercase tracking-tight italic opacity-90">Đã mua</h2>
              <div className="h-px w-12 bg-primary/20"></div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 rounded-full text-xs font-bold gap-2 text-muted-foreground hover:text-primary transition-all bg-muted/20 hover:bg-muted/40"
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={isLoadingHistory}
            >
              <ShoppingCart className={cn("size-3.5", isLoadingHistory && "animate-spin")} />
              Làm mới
            </Button>
          </div>
          
          {!isInitialized || isLoadingHistory ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-800/20 border border-border/40" />
              ))}
            </div>
          ) : purchasedOrders.length > 0 ? (
            <div className="space-y-10">
              {purchasedOrders.map((order) => (
                <div key={order.order_id} className="relative pl-8 border-l-2 border-primary/10">
                  <div className="absolute left-[-6px] top-1.5 size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] ring-4 ring-background"></div>
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black text-primary/60 flex items-center gap-2 uppercase tracking-[0.2em]">
                      Order #{order.order_id.slice(0, 8)} • {new Date(order.created_at).toLocaleString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </p>
                    {order.status === "delivering" && formatEtaCountdown(order.estimated_arrival_at, nowMs) && (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {formatEtaCountdown(order.estimated_arrival_at, nowMs)}
                      </span>
                    )}
                    {order.status === "completed" && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 rounded-full bg-primary px-3 text-[10px] font-bold uppercase tracking-wider text-white"
                        onClick={() => void handleConfirmReceived(order.order_id)}
                        disabled={confirmingOrderId === order.order_id}
                      >
                        {confirmingOrderId === order.order_id ? "ĐANG XÁC NHẬN..." : "ĐÃ NHẬN HÀNG"}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {order.items.map((item) => (
                      <div key={item.product_id} className="group flex gap-4 rounded-2xl bg-muted/10 p-3 border border-border/40 hover:border-primary/30 hover:bg-muted/30 transition-all duration-300">
                        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                          <img
                            src={item.images?.[0] ?? item.image ?? ""}
                            alt={item.name}
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-center min-w-0">
                          <p className="line-clamp-1 text-sm font-bold mb-0.5 text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{formatPrice(item.price)}</p>
                          <div className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 w-fit uppercase tracking-wider border border-green-500/20">
                            Đã mua
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/5 rounded-3xl border-2 border-dashed border-border/40 p-12 text-center">
              <ShoppingCart className="mx-auto mb-4 size-12 text-muted-foreground/20" />
              <p className="italic text-sm text-muted-foreground">
                Bạn chưa có lịch sử mua hàng trong hệ thống.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

