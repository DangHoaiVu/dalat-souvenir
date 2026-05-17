import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabaseClient";
import { mapProductRow, type SupabaseProductRow } from "@/lib/map-supabase-product";
import { requireAdmin } from "@/lib/server-auth";
import type { Address, Order, Product } from "@/types";

const supabase = createAdminSupabaseClient();
const MAX_MOTORBIKE_SPEED_KMH = 40;
const MIN_ETA_SECONDS = 5 * 60;

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

type SupabaseProfileRow = {
  user_id: string;
  full_name: string | null;
  phone_number: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

function ensureNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === undefined || value === null) {
    return fallback;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildOrderCode(orderId?: string | null) {
  if (!orderId) {
    return "—";
  }
  const sanitized = orderId.replace(/[^a-z0-9]/gi, "");
  const snippet = sanitized.slice(0, 8).toUpperCase();
  return snippet ? `#${snippet}` : "—";
}

function buildAddress(profile?: SupabaseProfileRow | null): Address {
  const raw = profile?.address?.trim() ?? "";
  const segments = raw
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const province = segments.at(-1) ?? "";
  const district = segments.at(-2) ?? "";
  const ward = segments.at(-3) ?? "";
  return {
    id: profile?.user_id ?? "",
    name: profile?.full_name?.trim() || "Khách hàng",
    phone: profile?.phone_number?.trim() ?? "",
    province,
    district,
    ward,
    address: raw,
    isDefault: false,
    latitude: ensureNumber(profile?.latitude, 0) || undefined,
    longitude: ensureNumber(profile?.longitude, 0) || undefined,
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

function mapUiStatusToDbStatus(status: Order["status"]): string {
  switch (status) {
    case "shipping":
      return "delivering";
    case "delivered":
      return "completed";
    default:
      return status;
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
    category: {
      category_id: "",
      name: "",
      slug: "",
    },
    avgRating: 0,
    reviewCount: 0,
  };
}

async function calculateRoadDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`OSRM route failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    routes?: Array<{ distance?: number }>;
  };

  const meters = payload.routes?.[0]?.distance;
  if (!Number.isFinite(meters)) {
    throw new Error("Không lấy được quãng đường đường bộ");
  }

  return Number(meters) / 1000;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("order_id, user_id, total_price, created_at, status, delivery_started_at, estimated_arrival_at, customer_name, customer_phone, customer_address, payment_method")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(200);

    if (orderError) {
      console.error("[API/orders] Failed to load orders", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const orders = (orderRows ?? []) as SupabaseOrderRow[];
    if (!orders.length) {
      return NextResponse.json([]);
    }

    const orderIds = orders.map((row) => row.order_id).filter(Boolean);
    const userIds = Array.from(
      new Set(orders.map((row) => row.user_id).filter((id): id is string => Boolean(id))),
    );

    const { data: orderItems, error: itemsError } = orderIds.length
      ? await supabase
          .from("order_items")
          .select("order_id, product_id, quantity, price_at_purchase")
          .in("order_id", orderIds)
      : { data: [] as SupabaseOrderItemRow[], error: null };

    if (itemsError) {
      console.warn("[API/orders] Failed to load order_items", itemsError);
    }

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, phone_number, address, latitude, longitude")
          .in("user_id", userIds)
      : { data: [] as SupabaseProfileRow[], error: null };

    if (profilesError) {
      console.warn("[API/orders] Failed to load profiles", profilesError);
    }

    const items = (orderItems ?? []) as SupabaseOrderItemRow[];
    const itemsByOrderId = new Map<string, SupabaseOrderItemRow[]>();
    items.forEach((item) => {
      if (!item.order_id) {
        return;
      }
      const list = itemsByOrderId.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrderId.set(item.order_id, list);
    });

    const profileMap = new Map<string, SupabaseProfileRow>();
    (profiles ?? []).forEach((profile) => {
      if (profile.user_id) {
        profileMap.set(profile.user_id, profile);
      }
    });

    const productIds = Array.from(
      new Set(items.map((item) => item.product_id).filter(Boolean)),
    );
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
      console.warn("[API/orders] Failed to load products", productError);
    }

    const productMap = new Map<string, Product>();
    (productRows ?? []).forEach((row) => {
      if (!row?.product_id) {
        return;
      }
      productMap.set(row.product_id, mapProductRow(row as SupabaseProductRow));
    });

    const mapped: Order[] = orders
      .map((row) => {
        const itemsForOrder = (itemsByOrderId.get(row.order_id) ?? []).map((item, index) => {
          const product =
            productMap.get(item.product_id) ?? buildFallbackProduct(item.product_id, 0);
          const quantity = Math.max(1, ensureNumber(item.quantity, 1));
          const priceAtPurchase =
            item.price_at_purchase != null
              ? ensureNumber(item.price_at_purchase, product.price)
              : product.price;
          const subtotal = priceAtPurchase * quantity;
          return {
            id: `${row.order_id}-${item.product_id}-${index}`,
            product,
            quantity,
            price: priceAtPurchase,
            subtotal,
          };
        });

        const subtotal = itemsForOrder.reduce((sum, it) => sum + it.subtotal, 0);
        const total = ensureNumber(row.total_price, subtotal);
        const shippingFee = Math.max(total - subtotal, 0);
        const profile = row.user_id ? profileMap.get(row.user_id) : undefined;
        
        const shippingAddress = buildAddress(profile);
        
        // Override with explicit order customer info if available (useful for guests)
        if (row.customer_name) shippingAddress.name = row.customer_name;
        if (row.customer_phone) shippingAddress.phone = row.customer_phone;
        if (row.customer_address) {
           shippingAddress.address = row.customer_address;
           shippingAddress.province = "";
           shippingAddress.district = "";
           shippingAddress.ward = "";
        }

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
          shippingFee,
          total,
          shippingAddress,
          createdAt: row.created_at ?? new Date().toISOString(),
        } satisfies Order;
      })
      .filter((order) => Boolean(order.id));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("[API/orders] Unexpected error", error);
    return NextResponse.json({ error: "Không thể tải danh sách đơn" }, { status: 500 });
  }
}

type UpdateOrderPayload = {
  orderId?: string;
  status?: Order["status"];
  sellerLatitude?: number;
  sellerLongitude?: number;
};

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const payload = (await request.json()) as UpdateOrderPayload;
    const orderId = String(payload.orderId ?? "").trim();
    const nextStatus = payload.status;

    if (!orderId || !nextStatus) {
      return NextResponse.json({ error: "Thiếu orderId hoặc status" }, { status: 400 });
    }

    const dbStatus = mapUiStatusToDbStatus(nextStatus);
    const updatePayload: Record<string, string | null> = {
      status: dbStatus,
    };

    if (dbStatus === "delivering") {
      const sellerLatitude = Number(payload.sellerLatitude);
      const sellerLongitude = Number(payload.sellerLongitude);

      if (!Number.isFinite(sellerLatitude) || !Number.isFinite(sellerLongitude)) {
        return NextResponse.json(
          { error: "Thiếu tọa độ người bán để tính ETA" },
          { status: 400 },
        );
      }

      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .select("user_id")
        .eq("order_id", orderId)
        .single();

      if (orderError || !orderRow?.user_id) {
        return NextResponse.json({ error: "Không tìm thấy người mua của đơn" }, { status: 404 });
      }

      const { data: buyerProfile, error: buyerError } = await supabase
        .from("profiles")
        .select("latitude, longitude")
        .eq("user_id", orderRow.user_id)
        .maybeSingle();

      const buyerLatitude = Number(buyerProfile?.latitude);
      const buyerLongitude = Number(buyerProfile?.longitude);
      if (buyerError || !Number.isFinite(buyerLatitude) || !Number.isFinite(buyerLongitude)) {
        return NextResponse.json(
          { error: "Thiếu tọa độ người mua để tính ETA" },
          { status: 400 },
        );
      }

      const distanceKm = await calculateRoadDistanceKm(
        sellerLatitude,
        sellerLongitude,
        buyerLatitude,
        buyerLongitude,
      );

      const etaSeconds = Math.max(
        MIN_ETA_SECONDS,
        Math.ceil((distanceKm / MAX_MOTORBIKE_SPEED_KMH) * 3600),
      );

      const deliveryStartedAt = new Date();
      const estimatedArrivalAt = new Date(deliveryStartedAt.getTime() + etaSeconds * 1000);

      updatePayload.delivery_started_at = deliveryStartedAt.toISOString();
      updatePayload.estimated_arrival_at = estimatedArrivalAt.toISOString();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("order_id", orderId)
      .select("order_id, status, delivery_started_at, estimated_arrival_at")
      .single();

    if (error) {
      console.error("[API/orders] Failed to update status", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      order_id: data.order_id,
      status: mapDbStatusToUiStatus(data.status),
      deliveryStartedAt: data.delivery_started_at,
      estimatedArrivalAt: data.estimated_arrival_at,
    });
  } catch (error) {
    console.error("[API/orders] Unexpected patch error", error);
    return NextResponse.json({ error: "Không thể cập nhật đơn" }, { status: 500 });
  }
}
