"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import OrderDetailDrawer from "@/components/admin/OrderDetailDrawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/types";

const statusLabel: Record<Order["status"], string> = {
  pending: "Chờ xử lý",
  confirmed: "Xác nhận",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusClass: Record<Order["status"], string> = {
  pending: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900/50",
  confirmed: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
  shipping: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-100 dark:border-orange-900/50",
  delivered: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-100 dark:border-green-900/50",
  cancelled: "bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800",
};

const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const ONE_DAY_SECONDS = 24 * 60 * 60;

function formatEtaCountdown(estimatedArrivalAt?: string, nowMs?: number): string | null {
  if (!estimatedArrivalAt || !nowMs) return null;

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

export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Unable to load orders (${response.status})`);
      }
      const payload: Order[] = await response.json();
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("[Admin/Orders] Failed to load orders", err);
      setError("Không thể tải dữ liệu đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          void fetchOrders();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          void fetchOrders();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders" },
        () => {
          void fetchOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  useEffect(() => {
    const refreshIntervalId = window.setInterval(() => {
      void fetchOrders();
    }, 15000);

    const tickerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    const onFocus = () => {
      void fetchOrders();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(refreshIntervalId);
      window.clearInterval(tickerId);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: number | string, status: Order["status"]) => {
    try {
      setIsUpdating(true);
      setError(null);

      let sellerLatitude: number | undefined;
      let sellerLongitude: number | undefined;

      if (status === "shipping") {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user?.id) {
          throw new Error("Không xác định được người bán");
        }
        const { data: sellerProfile, error: profileError } = await supabase
          .from("profiles")
          .select("latitude, longitude")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        sellerLatitude = sellerProfile?.latitude ? Number(sellerProfile.latitude) : undefined;
        sellerLongitude = sellerProfile?.longitude ? Number(sellerProfile.longitude) : undefined;

        if (
          profileError ||
          !Number.isFinite(sellerLatitude) ||
          !Number.isFinite(sellerLongitude)
        ) {
          throw new Error("Vui lòng cập nhật tọa độ cửa hàng trong hồ sơ trước khi bắt đầu giao");
        }
      }

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: String(orderId),
          status,
          sellerLatitude,
          sellerLongitude,
        }),
      });

      if (!response.ok) {
        throw new Error(`Unable to update order (${response.status})`);
      }

      await fetchOrders();
    } catch (err) {
      console.error("[Admin/Orders] Failed to update status", err);
      setError("Không thể cập nhật trạng thái đơn hàng");
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = useMemo(
    () =>
      orders.filter(
        (order) => order.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders, search],
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Quản lý đơn hàng</h1>

      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <Input
          placeholder="Tìm theo mã đơn..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card text-card-foreground p-2 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  Đang tải đơn hàng...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">
                  Không có đơn hàng phù hợp
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                   setSelectedOrder(order);
                   setOpen(true);
                }}>
                  <TableCell className="font-medium">{order.code}</TableCell>
                  <TableCell>{order.shippingAddress.name}</TableCell>
                  <TableCell>{order.createdAt}</TableCell>
                  <TableCell>{order.items.length} món</TableCell>
                  <TableCell className="font-bold text-primary">{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusClass[order.status]} border font-medium`}>{statusLabel[order.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.status === "shipping" && order.estimatedArrivalAt ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        {formatEtaCountdown(order.estimatedArrivalAt, nowMs)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-primary font-bold hover:underline"
                    >
                      Chi tiết
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailDrawer
        open={open}
        onOpenChange={setOpen}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdating}
      />
    </div>
  );
}
