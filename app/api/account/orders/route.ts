import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { mapProductRow, type SupabaseProductRow } from "@/lib/map-supabase-product";
import { isSupabaseProductId } from "@/lib/product-id";
import { getOptionalUser } from "@/lib/server-auth";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";
import type { Address, Order, Product } from "@/types";

const supabase = createAdminSupabaseClient();

type SupabaseOrderRow = {
  order_id: string;
  user_id: string | null;
  total_price: number | string | null;
  created_at: string | null;
  status: string | null;
  delivery_started_at: string | null;
  estimated_arrival_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  payment_method: string | null;
};

type SupabaseOrderItemRow = {
  order_id: string;
  product_id: string;
  quantity: number | string | null;
  price_at_purchase: number | string | null;
};

function ensureNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === undefined || value === null) return fallback;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildOrderCode(orderId?: string | null) {
  if (!orderId) return "-";
  const snippet = orderId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  return snippet ? `#${snippet}` : "-";
}

function buildAddress(row: SupabaseOrderRow): Address {
  const raw = row.customer_address?.trim() ?? "";
  const segments = raw
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return {
    id: row.order_id,
    name: row.customer_name?.trim() || "Khách hàng",
    phone: row.customer_phone?.trim() ?? "",
    province: segments.at(-1) ?? "",
    district: segments.at(-2) ?? "",
    ward: segments.at(-3) ?? "",
    address: raw,
    isDefault: false,
  };
}

function mapDbStatusToUiStatus(status: string | null | undefined): Order["status"] {
  switch ((status ?? "pending").toLowerCase()) {
    case "confirmed":
      return "confirmed";
    case "delivering":
    case "shipping":
      return "shipping";
    case "completed":
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function buildFallbackProduct(productId: string, price: number): Product {
  const slugPart = productId.replace(/[^a-z0-9]/gi, "").slice(0, 12) || "unknown";
  return {
    product_id: productId,
    category_id: "",
    name: "Sản phẩm chưa rõ",
    slug: `product-${slugPart}`,
    description: "",
    story: "",
    price,
    comparePrice: price,
    images: [],
    image: "",
    unit: "",
    weightGram: 0,
    stock: 0,
    category: { category_id: "", name: "", slug: "" },
    avgRating: 0,
    reviewCount: 0,
  };
}

async function mapOrders(orders: SupabaseOrderRow[]): Promise<Order[]> {
  if (!orders.length) return [];

  const orderIds = orders.map((row) => row.order_id).filter(Boolean);

  const { data: orderItems, error: itemsError } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("order_id, product_id, quantity, price_at_purchase")
        .in("order_id", orderIds)
    : { data: [] as SupabaseOrderItemRow[], error: null };

  if (itemsError) {
    console.warn("[API/account/orders] Failed to load order_items", itemsError);
  }

  const items = (orderItems ?? []) as SupabaseOrderItemRow[];
  const itemsByOrderId = new Map<string, SupabaseOrderItemRow[]>();
  items.forEach((item) => {
    if (!item.order_id) return;
    const list = itemsByOrderId.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrderId.set(item.order_id, list);
  });

  const productIds = Array.from(new Set(items.map((item) => item.product_id).filter(Boolean)));
  const { data: productRows, error: productError } = productIds.length
    ? await supabase
        .from("products")
        .select(
          `
            product_id,
            category_id,
            name,
            unit,
            description,
            price,
            stock,
            image,
            promoted_price,
            is_for_sale,
            created_at,
            category:categories(name)
          `,
        )
        .in("product_id", productIds)
    : { data: [] as SupabaseProductRow[], error: null };

  if (productError) {
    console.warn("[API/account/orders] Failed to load products", productError);
  }

  const productMap = new Map<string, Product>();
  (productRows ?? []).forEach((row) => {
    if (row?.product_id) {
      productMap.set(row.product_id, mapProductRow(row as SupabaseProductRow));
    }
  });

  return orders.map((row) => {
    const itemsForOrder = (itemsByOrderId.get(row.order_id) ?? []).map((item, index) => {
      const product = productMap.get(item.product_id) ?? buildFallbackProduct(item.product_id, 0);
      const quantity = Math.max(1, ensureNumber(item.quantity, 1));
      const priceAtPurchase =
        item.price_at_purchase != null ? ensureNumber(item.price_at_purchase, product.price) : product.price;
      const subtotal = priceAtPurchase * quantity;

      return {
        id: `${row.order_id}-${item.product_id}-${index}`,
        product,
        quantity,
        price: priceAtPurchase,
        subtotal,
      };
    });

    const subtotal = itemsForOrder.reduce((sum, item) => sum + item.subtotal, 0);
    const total = ensureNumber(row.total_price, subtotal);

    return {
      id: row.order_id,
      code: buildOrderCode(row.order_id),
      status: mapDbStatusToUiStatus(row.status),
      deliveryStartedAt: row.delivery_started_at ?? undefined,
      estimatedArrivalAt: row.estimated_arrival_at ?? undefined,
      paymentMethod: row.payment_method === "vnpay" ? "vnpay" : "cod",
      paymentStatus: "unpaid",
      items: itemsForOrder,
      subtotal,
      discount: 0,
      shippingFee: Math.max(total - subtotal, 0),
      total,
      shippingAddress: buildAddress(row),
      createdAt: row.created_at ?? new Date().toISOString(),
    } satisfies Order;
  });
}

async function requireUser(req: NextRequest) {
  const { user, token, error } = await getOptionalUser(req);
  if (!token || !user) {
    return { ok: false as const, response: NextResponse.json({ error: error || "Missing auth token" }, { status: 401 }) };
  }
  return { ok: true as const, user };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const recentOrderIds = (searchParams.get("recent") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(isSupabaseProductId)
    .filter(Boolean)
    .slice(0, 8);

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const profilePhone = String(profile?.phone_number ?? "").trim();

  const { data: userOrderRows, error } = await supabase
    .from("orders")
    .select("order_id, user_id, total_price, created_at, status, delivery_started_at, estimated_arrival_at, customer_name, customer_phone, customer_address, payment_method")
    .eq("user_id", auth.user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[API/account/orders] Failed to load orders", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const claimableRows: SupabaseOrderRow[] = [];

  if (recentOrderIds.length > 0) {
    const { data: recentRows, error: recentError } = await supabase
      .from("orders")
      .select("order_id, user_id, total_price, created_at, status, delivery_started_at, estimated_arrival_at, customer_name, customer_phone, customer_address, payment_method")
      .in("order_id", recentOrderIds);

    if (recentError) {
      console.warn("[API/account/orders] Failed to load recent orders", recentError);
    } else {
      claimableRows.push(
        ...((recentRows ?? []) as SupabaseOrderRow[]).filter(
          (row) => (!row.user_id || row.user_id === auth.user.id) && row.status !== "cancelled",
        ),
      );
    }
  }

  if (profilePhone) {
    const { data: phoneRows, error: phoneError } = await supabase
      .from("orders")
      .select("order_id, user_id, total_price, created_at, status, delivery_started_at, estimated_arrival_at, customer_name, customer_phone, customer_address, payment_method")
      .is("user_id", null)
      .eq("customer_phone", profilePhone)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(30);

    if (phoneError) {
      console.warn("[API/account/orders] Failed to load phone-matched orders", phoneError);
    } else {
      claimableRows.push(...((phoneRows ?? []) as SupabaseOrderRow[]));
    }
  }

  const rowsById = new Map<string, SupabaseOrderRow>();
  [...((userOrderRows ?? []) as SupabaseOrderRow[]), ...claimableRows].forEach((row) => {
    if (row.order_id) rowsById.set(row.order_id, row);
  });

  const guestOrderIdsToClaim = Array.from(rowsById.values())
    .filter((row) => !row.user_id)
    .map((row) => row.order_id);

  if (guestOrderIdsToClaim.length > 0) {
    const { error: claimError } = await supabase
      .from("orders")
      .update({ user_id: auth.user.id })
      .in("order_id", guestOrderIdsToClaim);

    if (claimError) {
      console.warn("[API/account/orders] Failed to claim guest orders", claimError);
    } else {
      guestOrderIdsToClaim.forEach((orderId) => {
        const row = rowsById.get(orderId);
        if (row) rowsById.set(orderId, { ...row, user_id: auth.user.id });
      });
    }
  }

  const orders = await mapOrders(
    Array.from(rowsById.values()).sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime();
      const bTime = new Date(b.created_at ?? 0).getTime();
      return bTime - aTime;
    }),
  );
  return NextResponse.json(orders);
}

type PatchPayload = {
  action?: "update_info" | "cancel";
  orderId?: string;
  recentOrderIds?: string[];
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
    paymentMethod?: "cod" | "vnpay";
  };
};

function canCustomerChange(status: string | null | undefined) {
  const normalized = (status ?? "pending").toLowerCase();
  return normalized === "pending" || normalized === "confirmed";
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  const payload = (await req.json().catch(() => null)) as PatchPayload | null;
  const orderId = String(payload?.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
  }

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("order_id, user_id, status, customer_phone")
    .eq("order_id", orderId)
    .single();

  if (orderError || !orderRow) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  }

  const recentOrderIds = Array.isArray(payload?.recentOrderIds)
    ? payload.recentOrderIds.filter(isSupabaseProductId).slice(0, 8)
    : [];
  const isRecentLocalOrder = recentOrderIds.includes(orderId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const profilePhone = String(profile?.phone_number ?? "").trim();
  const orderPhone = String(orderRow.customer_phone ?? "").trim();
  const isPhoneMatchedGuestOrder = !orderRow.user_id && profilePhone && orderPhone && profilePhone === orderPhone;
  const canAccessOrder =
    orderRow.user_id === auth.user.id ||
    (!orderRow.user_id && (isRecentLocalOrder || isPhoneMatchedGuestOrder));

  if (!canAccessOrder) {
    return NextResponse.json({ error: "Bạn không có quyền thao tác đơn hàng này" }, { status: 403 });
  }

  if (!orderRow.user_id) {
    const { error: claimError } = await supabase
      .from("orders")
      .update({ user_id: auth.user.id })
      .eq("order_id", orderId);

    if (claimError) {
      console.warn("[API/account/orders] Failed to claim order before patch", claimError);
    }
  }

  if (!canCustomerChange(orderRow.status)) {
    return NextResponse.json({ error: "Đơn hàng đã chuyển sang trạng thái không thể chỉnh sửa" }, { status: 409 });
  }

  if (payload?.action === "cancel") {
    const { error: itemsDeleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsDeleteError) {
      console.error("[API/account/orders] Failed to delete order items", itemsDeleteError);
      return NextResponse.json({ error: itemsDeleteError.message }, { status: 500 });
    }

    const { error: orderDeleteError } = await supabase
      .from("orders")
      .delete()
      .eq("order_id", orderId);

    if (orderDeleteError) {
      console.error("[API/account/orders] Failed to delete cancelled order", orderDeleteError);
      return NextResponse.json({ error: orderDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (payload?.action === "update_info") {
    const info = payload.customerInfo ?? {};
    const name = String(info.name ?? "").trim();
    const phone = String(info.phone ?? "").trim();
    const address = String(info.address ?? "").trim();
    const paymentMethod = info.paymentMethod === "vnpay" ? "vnpay" : "cod";

    if (!name || !phone || !address) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ" }, { status: 400 });
    }

    const { error } = await supabase
      .from("orders")
      .update({
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        payment_method: paymentMethod,
      })
      .eq("order_id", orderId);

    if (error) {
      console.error("[API/account/orders] Failed to update order info", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("profiles").upsert(
      {
        user_id: auth.user.id,
        full_name: name,
        phone_number: phone,
        address,
      },
      { onConflict: "user_id" },
    );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
}
