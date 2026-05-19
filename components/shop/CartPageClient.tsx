"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Minus, PackageCheck, PackageOpen, Plus, RefreshCw, ShoppingCart, Sparkles, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OrderRowSkeleton } from "@/components/ui/skeleton";
import { authFetch } from "@/lib/auth-fetch";
import { cartProductId } from "@/lib/cart-product-id";
import { mapProductRow, type SupabaseProductRow } from "@/lib/map-supabase-product";
import { isSupabaseProductId } from "@/lib/product-id";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types";
import { supabase } from "@/lib/supabaseClient";

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
  total_price: number;
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
    const hours = Math.floor(remainingSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = Math.floor(remainingSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  return `Còn ${Math.ceil(remainingSeconds / ONE_DAY_SECONDS)} ngày`;
}

function statusLabel(status: string) {
  if (status === "completed") return "Chờ xác nhận";
  if (status === "delivering") return "Đang giao";
  if (status === "cancelled") return "Đã hủy";
  if (status === "confirmed") return "Đã xác nhận";
  return "Đang xử lý";
}

function purchaseStatusLabel(status: string) {
  if (status === "delivered") return "Hoàn thành";
  if (status === "shipping" || status === "delivering") return "Đang giao";
  if (status === "cancelled") return "Đã hủy";
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "completed") return "Chờ xác nhận";
  return "Đang xử lý";
}

function purchaseStatusTone(status: string) {
  if (status === "delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (status === "shipping" || status === "delivering") return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300";
  if (status === "cancelled") return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  if (status === "confirmed") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
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

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !isInitialized) return;
    if (!isLoggedIn) router.replace("/login?redirect=/cart");
  }, [isInitialized, isLoggedIn, mounted, router]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      if (!isInitialized || !mounted) return;
      if (!isLoggedIn || !user?.id) {
        setPurchasedOrders([]);
        return;
      }

      try {
        setIsLoadingHistory(true);
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("order_id, created_at, status, estimated_arrival_at, total_price")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (ordersError || !orders?.length) {
          setPurchasedOrders([]);
          return;
        }

        const orderIds = orders.map((order) => order.order_id);
        const { data: details, error: detailsError } = await supabase
          .from("order_items")
          .select("order_id, product_id")
          .in("order_id", orderIds);

        if (detailsError || !details?.length) {
          setPurchasedOrders([]);
          return;
        }

        const productIds = Array.from(new Set(details.map((detail) => detail.product_id)));
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*, category:categories(name)")
          .in("product_id", productIds);

        if (productsError || !productsData?.length) {
          setPurchasedOrders([]);
          return;
        }

        const productMap: Record<string, Product> = {};
        for (const row of productsData) {
          const productId = String((row as { product_id?: unknown }).product_id ?? "");
          if (productId) productMap[productId] = mapProductRow(row as SupabaseProductRow);
        }

        const grouped = orders
          .map((order) => {
            const orderItems = details
              .filter((detail) => detail.order_id === order.order_id)
              .map((detail) => productMap[detail.product_id])
              .filter(Boolean);

            return {
              order_id: order.order_id,
              created_at: order.created_at,
              status: String(order.status ?? "pending"),
              estimated_arrival_at: order.estimated_arrival_at ?? null,
              total_price: Number(order.total_price ?? 0),
              items: orderItems as Product[],
            };
          })
          .filter((order) => order.items.length > 0);

        setPurchasedOrders(grouped);
      } catch (error) {
        console.error("Error fetching purchase history:", error);
        setPurchasedOrders([]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    void fetchHistory();
  }, [isLoggedIn, user?.id, isInitialized, refreshKey, mounted]);

  const selectedItems = items.filter((item) => selectedItemIds.includes(cartProductId(item.product)));
  const selectedTotalPrice = selectedItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const discount = couponApplied ? Math.round(selectedTotalPrice * 0.1) : 0;
  const finalTotal = selectedTotalPrice - discount;
  const canApplyCoupon = useMemo(() => coupon.trim().toUpperCase() === "DALATSPECIAL", [coupon]);
  const isAllSelected = items.length > 0 && selectedItemIds.length === items.length;

  const handleToggleAll = () => {
    if (isAllSelected) deselectAllItems();
    else selectAllItems();
  };

  const handleOrderNow = async () => {
    if (selectedItems.length === 0) return;

    try {
      setIsSubmitting(true);
      const invalidItems = selectedItems.filter((item) => !isSupabaseProductId(item.product.product_id));
      if (invalidItems.length > 0) {
        invalidItems.forEach((item) => removeItem(item.product.product_id));
        alert("Giỏ hàng có sản phẩm cũ không còn hợp lệ. Mình đã xóa sản phẩm mẫu khỏi giỏ, vui lòng thêm lại sản phẩm từ danh sách hiện tại.");
        return;
      }

      const orderItems = selectedItems.map((item) => ({
        productId: item.product.product_id,
        amount: item.quantity,
        priceAtPurchase: item.product.price,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image || "",
      }));

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
          longitude,
        }),
      });

      const data = await res.json().catch(() => ({ error: "Server returned non-JSON response" }));
      if (!res.ok) {
        alert(data.error || data.details || "Đặt hàng thất bại. Vui lòng thử lại.");
        return;
      }

      if (data.orderId) {
        try {
          const current = JSON.parse(window.localStorage.getItem("shopluuniem-recent-order-ids") || "[]");
          const ids = Array.isArray(current) ? current.filter((id): id is string => typeof id === "string") : [];
          const orderId = String(data.orderId);
          window.localStorage.setItem(
            "shopluuniem-recent-order-ids",
            JSON.stringify([orderId, ...ids.filter((id) => id !== orderId)].slice(0, 8)),
          );
        } catch {
          window.localStorage.setItem("shopluuniem-recent-order-ids", JSON.stringify([String(data.orderId)]));
        }
      }

      removeSelectedItems();
      setRefreshKey((prev) => prev + 1);
      alert("Đặt hàng thành công!");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceived = async (orderId: string) => {
    if (!orderId || confirmingOrderId) return;

    try {
      setConfirmingOrderId(orderId);
      const { error } = await supabase.rpc("complete_order_and_deduct_stock", {
        p_order_id: orderId,
      });

      if (error) throw error;

      alert("Đã xác nhận nhận hàng thành công!");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Confirm received failed:", error);
      alert("Không thể xác nhận đơn hàng. Vui lòng thử lại.");
    } finally {
      setConfirmingOrderId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className={cn("grid gap-8 transition-all", items.length > 0 ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1")}>
        <section>
          {items.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Giỏ hàng</p>
                  <h1 className="mt-1 text-3xl font-bold text-primary">Sản phẩm đã chọn ({items.length})</h1>
                </div>
                <Button type="button" variant="ghost" className="text-error hover:text-error" onClick={clearCart}>
                  Xóa tất cả
                </Button>
              </div>

              <Card variant="flat" className="mb-4 flex-row items-center gap-3 p-3">
                <Checkbox checked={isAllSelected} onCheckedChange={handleToggleAll} />
                <span className="text-sm font-semibold text-primary">Chọn tất cả ({items.length}) sản phẩm</span>
              </Card>

              <div className="space-y-4">
                {items.map((item) => {
                  const pid = cartProductId(item.product);
                  const isSelected = selectedItemIds.includes(pid);
                  return (
                    <Card key={pid} variant="flat" className={cn("p-4", isSelected && "border-accent bg-accent-light/50")}>
                      <div className="flex gap-4">
                        <div className="flex items-center pt-1">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(pid)} />
                        </div>
                        <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                          <Image
                            src={item.product.images?.[0] ?? item.product.image ?? "/placeholder.png"}
                            alt={item.product.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-2 text-lg font-bold leading-tight text-primary">{item.product.name}</p>
                              <p className="mt-0.5 text-sm text-secondary">{item.product.category?.name ?? "Lưu niệm Đà Lạt"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(pid)}
                              className="rounded-md p-1 text-tertiary transition-colors hover:bg-error-light hover:text-error"
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="flex items-center rounded-md border border-[--color-border] bg-surface-muted p-0.5">
                              <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => updateQuantity(pid, item.quantity - 1)} aria-label="Giảm số lượng">
                                <Minus className="size-3.5" />
                              </Button>
                              <span className="w-9 text-center text-sm font-bold text-primary">{item.quantity}</span>
                              <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => updateQuantity(pid, item.quantity + 1)} aria-label="Tăng số lượng">
                                <Plus className="size-3.5" />
                              </Button>
                            </div>
                            <p className="text-lg font-bold text-accent">{formatPrice(item.product.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="flex min-h-[42vh] flex-col items-center justify-center p-12 text-center">
              <ShoppingCart className="mb-4 size-16 text-tertiary" />
              <h1 className="text-2xl font-semibold text-primary">Giỏ hàng của bạn đang trống</h1>
              <p className="mx-auto mt-2 max-w-xs text-secondary">
                Hãy khám phá những món lưu niệm Đà Lạt để bắt đầu mua sắm.
              </p>
              <Link href="/products" className="mt-6">
                <Button>Khám phá sản phẩm</Button>
              </Link>
            </Card>
          )}
        </section>

        {items.length > 0 && (
          <aside className="h-fit lg:sticky lg:top-24">
            <Card variant="flat" className="p-6">
              <h2 className="mb-6 text-xl font-bold text-primary">Tóm tắt đơn hàng</h2>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Đã chọn ({selectedCount} sản phẩm)</span>
                <span className="text-sm font-bold text-primary">{formatPrice(selectedTotalPrice)}</span>
              </div>

              {discount > 0 && (
                <div className="mb-4 flex items-center justify-between text-sm font-bold text-success">
                  <span>Giảm giá (10%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="my-6 border-t border-dashed border-[--color-border]" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">Tổng cộng</span>
                <span className="text-2xl font-bold text-accent">{formatPrice(finalTotal)}</span>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tertiary">Mã ưu đãi</p>
                <div className="flex gap-2">
                  <Input placeholder="Nhập mã..." value={coupon} onChange={(event) => setCoupon(event.target.value)} />
                  <Button variant="outline" onClick={() => setCouponApplied(canApplyCoupon)}>
                    Áp dụng
                  </Button>
                </div>
                {couponApplied && (
                  <p className="mt-2 flex items-center gap-2 rounded-md border border-success/20 bg-success-light p-2 text-xs font-medium text-success-text">
                    <span className="block size-1.5 rounded-full bg-success" />
                    Đã áp dụng mã DALATSPECIAL
                  </p>
                )}
              </div>

              <Button className="mt-8 w-full" size="lg" onClick={handleOrderNow} disabled={selectedItems.length === 0 || isSubmitting} isLoading={isSubmitting}>
                Đặt hàng ngay
              </Button>
            </Card>
          </aside>
        )}
      </div>

      {mounted && isLoggedIn && (
        <section className="mt-16 border-t border-dashed border-[--color-border] pt-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Lịch sử</p>
              <h2 className="mt-1 text-2xl font-bold text-primary">Đã mua</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
                Theo dõi nhanh các đơn gần đây, trạng thái giao hàng và quay lại mua những món bạn thích.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey((prev) => prev + 1)} disabled={isLoadingHistory} className="w-full sm:w-auto">
              <RefreshCw className={cn("size-4", isLoadingHistory && "animate-spin")} />
              Làm mới
            </Button>
          </div>

          {!isInitialized || isLoadingHistory ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <OrderRowSkeleton key={item} />
              ))}
            </div>
          ) : purchasedOrders.length > 0 ? (
            <div className="grid gap-4">
              {purchasedOrders.map((order) => {
                const previewItems = order.items.slice(0, 4);
                const orderTotal = order.total_price || order.items.reduce((sum, item) => sum + item.price, 0);
                const eta = formatEtaCountdown(order.estimated_arrival_at, nowMs);
                const isShipping = order.status === "shipping" || order.status === "delivering";
                const canConfirm = order.status === "completed";

                return (
                  <Card key={order.order_id} variant="flat" className="overflow-hidden p-0">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-light text-accent">
                              {isShipping ? <Truck className="size-5" /> : <PackageCheck className="size-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-primary">#{order.order_id.slice(0, 8).toUpperCase()}</p>
                                <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]", purchaseStatusTone(order.status))}>
                                  {purchaseStatusLabel(order.status)}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="size-3.5" />
                                  {new Date(order.created_at).toLocaleString("vi-VN")}
                                </span>
                                {eta && (
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                                    <Clock3 className="size-3.5" />
                                    {eta}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xs text-secondary">Tổng tiền</p>
                            <p className="mt-1 text-xl font-bold text-accent">{formatPrice(orderTotal)}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center">
                            {previewItems.map((item, itemIndex) => (
                              <div
                                key={`${order.order_id}-${item.product_id}-${itemIndex}`}
                                className={cn(
                                  "relative size-14 overflow-hidden rounded-xl border-2 border-surface bg-surface-muted shadow-sm",
                                  itemIndex > 0 && "-ml-3",
                                )}
                                style={{ zIndex: previewItems.length - itemIndex }}
                              >
                                <Image
                                  src={item.images?.[0] ?? item.image ?? "/placeholder.png"}
                                  alt={item.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            <div className="ml-3 min-w-0">
                              <p className="line-clamp-1 text-sm font-bold text-primary">
                                {order.items[0]?.name ?? "Đơn hàng"}
                              </p>
                              <p className="text-xs text-secondary">
                                {order.items.length} sản phẩm trong đơn
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            {canConfirm && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void handleConfirmReceived(order.order_id)}
                                disabled={confirmingOrderId === order.order_id}
                                isLoading={confirmingOrderId === order.order_id}
                              >
                                Đã nhận hàng
                              </Button>
                            )}
                            <Link href={`/account/orders?orderId=${order.order_id}`}>
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                Xem chi tiết
                                <ArrowRight className="size-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[--color-border] bg-surface-muted/50 p-4 sm:p-5 lg:border-l lg:border-t-0">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-tertiary">Gợi ý nhanh</p>
                        <div className="mt-4 space-y-3">
                          {previewItems.slice(0, 2).map((item) => (
                            <Link key={`${order.order_id}-quick-${item.product_id}`} href={`/products/${item.product_id}`} className="flex items-center gap-3 rounded-lg border border-[--color-border] bg-surface p-2 transition hover:border-accent/50">
                              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                                <Image src={item.images?.[0] ?? item.image ?? "/placeholder.png"} alt={item.name} fill sizes="40px" className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-1 text-xs font-bold text-primary">{item.name}</p>
                                <p className="text-[11px] text-accent">Mua lại</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="relative overflow-hidden p-0">
              <div className="absolute -right-16 -top-16 size-44 rounded-full bg-accent-light" />
              <div className="absolute -bottom-20 left-10 size-52 rounded-full bg-sky-100/60 dark:bg-sky-900/20" />
              <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-accent-light text-accent shadow-sm">
                    <PackageOpen className="size-8" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Chưa có lịch sử</p>
                  <h3 className="mt-2 text-2xl font-bold text-primary">Bắt đầu đơn hàng đầu tiên</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">
                    Khi bạn đặt hàng thành công, trạng thái xử lý, sản phẩm đã mua và gợi ý mua lại sẽ xuất hiện tại đây.
                  </p>
                  <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <Link href="/products">
                      <Button className="w-full sm:w-auto">
                        Mua sắm ngay
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                    <Link href="/products?category=qua-tang">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Sparkles className="size-4" />
                        Xem bộ quà tặng
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="hidden rounded-2xl border border-[--color-border] bg-surface/80 p-5 shadow-sm lg:block">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-xl bg-success-light text-success">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">Theo dõi dễ hơn</p>
                      <p className="text-xs text-secondary">Mã đơn, trạng thái và sản phẩm cùng một nơi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </section>
      )}

      {false && mounted && isLoggedIn && (
        <section className="mt-16 border-t border-dashed border-[--color-border] pt-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Lịch sử</p>
              <h2 className="mt-1 text-2xl font-bold text-primary">Đã mua</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey((prev) => prev + 1)} disabled={isLoadingHistory}>
              <RefreshCw className={cn("size-4", isLoadingHistory && "animate-spin")} />
              Làm mới
            </Button>
          </div>

          {!isInitialized || isLoadingHistory ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <OrderRowSkeleton key={item} />
              ))}
            </div>
          ) : purchasedOrders.length > 0 ? (
            <div className="space-y-8">
              {purchasedOrders.map((order) => (
                <div key={order.order_id} className="relative border-l-2 border-accent-light pl-6">
                  <div className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-accent ring-4 ring-background" />
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                      Order #{order.order_id.slice(0, 8)} • {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                    <span className="rounded-full bg-accent-light px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-text">
                      {statusLabel(order.status)}
                    </span>
                    {order.status === "delivering" && formatEtaCountdown(order.estimated_arrival_at, nowMs) && (
                      <span className="rounded-full bg-warning-light px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-warning-text">
                        {formatEtaCountdown(order.estimated_arrival_at, nowMs)}
                      </span>
                    )}
                    {order.status === "completed" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleConfirmReceived(order.order_id)}
                        disabled={confirmingOrderId === order.order_id}
                        isLoading={confirmingOrderId === order.order_id}
                      >
                        Đã nhận hàng
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {order.items.map((item) => (
                      <Card key={item.product_id} variant="flat" className="flex-row gap-4 p-3">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                          <Image
                            src={item.images?.[0] ?? item.image ?? "/placeholder.png"}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <p className="line-clamp-1 text-sm font-bold text-primary">{item.name}</p>
                          <p className="mb-2 text-xs text-secondary">{formatPrice(item.price)}</p>
                          <div className="inline-flex w-fit items-center gap-1 rounded-full border border-success/20 bg-success-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-success-text">
                            <CheckCircle2 className="size-3" />
                            Đã mua
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="items-center p-12 text-center">
              <PackageCheck className="mb-4 size-12 text-tertiary" />
              <p className="text-sm text-secondary">Bạn chưa có lịch sử mua hàng trong hệ thống.</p>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
