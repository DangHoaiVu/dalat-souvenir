"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Clock3, Loader2, PackageCheck, Pencil, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth-fetch";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const statusLabel: Record<Order["status"], string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusClass: Record<Order["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
  confirmed: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300",
  shipping: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  cancelled: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
};

const statusIcon: Record<Order["status"], typeof Clock3> = {
  pending: Clock3,
  confirmed: PackageCheck,
  shipping: Truck,
  delivered: CheckCircle2,
  cancelled: Ban,
};

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")}đ`;
const formatDate = (value: string) => new Date(value).toLocaleString("vi-VN");

function canCustomerChange(order: Order) {
  return order.status === "pending" || order.status === "confirmed";
}

type EditForm = {
  name: string;
  phone: string;
  address: string;
  paymentMethod: "cod" | "vnpay";
};

function formFromOrder(order: Order): EditForm {
  return {
    name: order.shippingAddress.name ?? "",
    phone: order.shippingAddress.phone ?? "",
    address: order.shippingAddress.address ?? "",
    paymentMethod: order.paymentMethod,
  };
}

function getRecentOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem("shopluuniem-recent-order-ids") || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}

export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "", address: "", paymentMethod: "cod" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      const recentIds = getRecentOrderIds();
      const urlOrderId =
        typeof window === "undefined"
          ? ""
          : new URLSearchParams(window.location.search).get("orderId") ?? "";
      const idsToSend = [urlOrderId, ...recentIds].filter(Boolean);
      if (idsToSend.length > 0) {
        params.set("recent", Array.from(new Set(idsToSend)).slice(0, 8).join(","));
      }

      const endpoint = params.size ? `/api/account/orders?${params.toString()}` : "/api/account/orders";
      const response = await authFetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Unable to load orders (${response.status})`);
      }
      const payload: Order[] = await response.json();
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("[Account/Orders] Failed to load orders", err);
      setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("customer-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void fetchOrders();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === expandedOrderId) ?? null,
    [expandedOrderId, orders],
  );

  const startEdit = (order: Order) => {
    setExpandedOrderId(order.id);
    setEditingOrderId(order.id);
    setEditForm(formFromOrder(order));
  };

  const cancelEdit = () => {
    setEditingOrderId(null);
    if (selectedOrder) {
      setEditForm(formFromOrder(selectedOrder));
    }
  };

  const updateOrderInfo = async (order: Order) => {
    if (!canCustomerChange(order) || isSaving) return;

    try {
      setIsSaving(true);
      setActiveActionId(order.id);
      const response = await authFetch("/api/account/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_info",
          orderId: order.id,
          recentOrderIds: getRecentOrderIds(),
          customerInfo: editForm,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Không thể cập nhật đơn hàng");
      }

      toast.success("Đã cập nhật thông tin đơn hàng");
      setEditingOrderId(null);
      await fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật đơn hàng";
      toast.error(message);
    } finally {
      setIsSaving(false);
      setActiveActionId(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!canCustomerChange(order) || activeActionId) return;
    const confirmed = window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?");
    if (!confirmed) return;

    try {
      setActiveActionId(order.id);
      const response = await authFetch("/api/account/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", orderId: order.id, recentOrderIds: getRecentOrderIds() }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Không thể hủy đơn hàng");
      }

      toast.success("Đã hủy đơn hàng");
      await fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể hủy đơn hàng";
      toast.error(message);
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Đơn hàng của tôi</h1>
          <p className="mt-1 text-sm text-secondary">
            Theo dõi trạng thái, cập nhật thông tin giao hàng hoặc hủy đơn khi đơn chưa giao.
          </p>
        </div>
        <Button variant="outline" onClick={() => void fetchOrders()} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-sm font-medium text-error-text">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="p-5">
              <div className="h-6 w-44 rounded-md bg-surface-muted" />
              <div className="mt-4 h-4 w-full rounded-md bg-surface-muted" />
              <div className="mt-3 h-4 w-2/3 rounded-md bg-surface-muted" />
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="items-center p-10 text-center">
          <PackageCheck className="size-12 text-accent" />
          <h2 className="mt-4 text-xl font-bold text-primary">Chưa có đơn hàng</h2>
          <p className="mt-2 max-w-md text-sm text-secondary">
            Khi bạn đặt hàng thành công, lịch sử đơn và trạng thái xử lý sẽ hiển thị tại đây.
          </p>
          <Link href="/products" className="mt-5">
            <Button>Mua sắm ngay</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const Icon = statusIcon[order.status];
            const expanded = expandedOrderId === order.id;
            const editing = editingOrderId === order.id;
            const mutable = canCustomerChange(order);

            return (
              <Card key={order.id} variant="flat" className="overflow-hidden p-0">
                <button
                  type="button"
                  className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-surface-muted/60 md:flex-row md:items-center md:justify-between"
                  onClick={() => {
                    setExpandedOrderId(expanded ? null : order.id);
                    if (editingOrderId && editingOrderId !== order.id) setEditingOrderId(null);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent-light text-accent">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-primary">{order.code}</p>
                        <Badge variant="outline" className={cn("border font-semibold", statusClass[order.status])}>
                          {statusLabel[order.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-secondary">
                        {formatDate(order.createdAt)} · {order.items.length} sản phẩm
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-secondary">Tổng tiền</p>
                    <p className="text-lg font-bold text-accent">{formatPrice(order.total)}</p>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-[--color-border] p-5">
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                      <div>
                        <h3 className="font-bold text-primary">Sản phẩm đã đặt</h3>
                        <div className="mt-3 space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex gap-3 rounded-lg border border-[--color-border] bg-surface p-3">
                              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                                <Image
                                  src={item.product.images?.[0] || item.product.image || "/placeholder.png"}
                                  alt={item.product.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 font-semibold text-primary">{item.product.name}</p>
                                <p className="mt-1 text-sm text-secondary">
                                  {formatPrice(item.price)} x {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-primary">{formatPrice(item.subtotal)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-[--color-border] bg-surface p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-bold text-primary">Thông tin đơn hàng</h3>
                          {mutable && !editing && (
                            <Button variant="outline" size="sm" onClick={() => startEdit(order)}>
                              <Pencil className="mr-2 size-4" />
                              Sửa
                            </Button>
                          )}
                        </div>

                        {editing ? (
                          <div className="mt-4 space-y-3">
                            <div>
                              <Label>Họ tên</Label>
                              <Input value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                            </div>
                            <div>
                              <Label>Số điện thoại</Label>
                              <Input value={editForm.phone} onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))} />
                            </div>
                            <div>
                              <Label>Địa chỉ giao hàng</Label>
                              <Textarea
                                value={editForm.address}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                                className="min-h-24 bg-surface"
                              />
                            </div>
                            <div>
                              <Label>Thanh toán</Label>
                              <select
                                value={editForm.paymentMethod}
                                onChange={(event) =>
                                  setEditForm((prev) => ({ ...prev, paymentMethod: event.target.value === "vnpay" ? "vnpay" : "cod" }))
                                }
                                className="mt-1 h-11 w-full rounded-lg border border-[--color-border] bg-surface px-3 text-sm text-primary outline-none focus:border-[--color-accent]"
                              >
                                <option value="cod">Thanh toán khi nhận hàng</option>
                                <option value="vnpay">Chuyển khoản/VNPay</option>
                              </select>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                                Hủy sửa
                              </Button>
                              <Button onClick={() => void updateOrderInfo(order)} disabled={isSaving}>
                                {isSaving && activeActionId === order.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                Lưu thông tin
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-2 text-sm text-secondary">
                            <p><span className="font-semibold text-primary">Người nhận:</span> {order.shippingAddress.name}</p>
                            <p><span className="font-semibold text-primary">SĐT:</span> {order.shippingAddress.phone}</p>
                            <p><span className="font-semibold text-primary">Địa chỉ:</span> {order.shippingAddress.address || "Chưa có địa chỉ"}</p>
                            <p><span className="font-semibold text-primary">Thanh toán:</span> {order.paymentMethod === "vnpay" ? "Chuyển khoản/VNPay" : "COD"}</p>
                            {order.estimatedArrivalAt && (
                              <p><span className="font-semibold text-primary">Dự kiến giao:</span> {formatDate(order.estimatedArrivalAt)}</p>
                            )}
                          </div>
                        )}

                        <div className="mt-5 border-t border-[--color-border] pt-4">
                          {mutable ? (
                            <Button
                              variant="destructive"
                              className="w-full"
                              onClick={() => void cancelOrder(order)}
                              disabled={Boolean(activeActionId)}
                            >
                              {activeActionId === order.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Ban className="mr-2 size-4" />}
                              Hủy đơn hàng
                            </Button>
                          ) : (
                            <p className="rounded-lg bg-surface-muted p-3 text-sm text-secondary">
                              Đơn hàng đã chuyển trạng thái nên không thể cập nhật hoặc hủy từ tài khoản khách hàng.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
