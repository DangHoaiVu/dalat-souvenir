import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { OrderItem } from 'src/app/models/orderItem.model';
import { WebOrderItem } from 'src/app/models/web-order-item.model';
import { SqliteService } from './sqlite.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor(
    private sqlite: SqliteService,
    private supabase: SupabaseService,
  ) {}

  private isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }

  async getPurchasedItemsFromSupabase(): Promise<OrderItem[]> {
    const userId = await this.getAuthedSupabaseUserId();
    if (!userId) {
      return [];
    }

    // 1) Load orders for the current user
    const { data: orders, error: ordersError } = await this.supabase.client
      .from('orders')
      .select('order_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[OrderService] getPurchasedItemsFromSupabase orders error', ordersError);
      return [];
    }

    const orderDocs = (orders ?? []).map((row: any) => ({
      id: String(row?.order_id ?? ''),
      createdAt: (row?.created_at ?? null) as string | null,
    })).filter((o) => !!o.id);

    if (!orderDocs.length) return [];

    const orderCreatedAtById = new Map(orderDocs.map((o) => [o.id, o.createdAt ?? null] as const));

    const orderIds = orderDocs.map((o) => o.id);

    // 2) Load all order_items for these orders
    const { data: items, error: itemsError } = await this.supabase.client
      .from('order_items')
      .select('order_id, product_id, quantity, price_at_purchase')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('[OrderService] getPurchasedItemsFromSupabase items error', itemsError);
      return [];
    }

    const lineItems = (items ?? []).map((row: any) => ({
      orderId: String(row?.order_id ?? ''),
      productId: String(row?.product_id ?? ''),
      quantity: Math.max(1, Math.floor(Number(row?.quantity ?? 1))),
      priceAtPurchase: Number(row?.price_at_purchase ?? 0),
    })).filter((li) => !!li.orderId && !!li.productId);

    if (!lineItems.length) return [];

    // 3) Load product details for referenced products
    const productIds = Array.from(new Set(lineItems.map((x) => x.productId)));
    const { data: products, error: productsError } = await this.supabase.client
      .from('products')
      .select('product_id, name, image')
      .in('product_id', productIds);

    if (productsError) {
      console.error('[OrderService] getPurchasedItemsFromSupabase products error', productsError);
      return [];
    }

    const productsById = new Map<string, any>();
    for (const row of products ?? []) {
      const id = String((row as any)?.product_id ?? '');
      if (id) {
        productsById.set(id, row);
      }
    }

    const result: OrderItem[] = lineItems.map((li) => {
      const product = productsById.get(li.productId);
      const purchasedAt = orderCreatedAtById.get(li.orderId) ?? undefined;

      return {
        id: `${li.orderId}:${li.productId}`,
        orderId: li.orderId,
        productId: li.productId,
        amount: li.quantity,
        priceAtPurchase: Number.isFinite(li.priceAtPurchase) ? li.priceAtPurchase : 0,
        name: String(product?.name ?? 'Unknown product'),
        image: String(product?.image ?? 'assets/sampleimg/strawberry.jpg'),
        purchased: true,
        purchasedAt: purchasedAt ?? undefined,
      } satisfies OrderItem;
    });

    return result.sort((a, b) => String(b.purchasedAt ?? '').localeCompare(String(a.purchasedAt ?? '')));
  }

  async getPurchasedOrdersFromSupabase(): Promise<Array<{ orderId: string; purchasedAt?: string; items: OrderItem[] }>> {
    const items = await this.getPurchasedItemsFromSupabase();
    if (items.length === 0) {
      return [];
    }

    const groupsByOrderId = new Map<string, { orderId: string; purchasedAt?: string; items: OrderItem[] }>();

    for (const item of items) {
      const orderId = String(item.orderId ?? '');
      if (!orderId) {
        continue;
      }

      const existing = groupsByOrderId.get(orderId);
      if (existing) {
        existing.items.push(item);
        if (item.purchasedAt && (!existing.purchasedAt || String(item.purchasedAt) > String(existing.purchasedAt))) {
          existing.purchasedAt = item.purchasedAt;
        }
      } else {
        groupsByOrderId.set(orderId, {
          orderId,
          purchasedAt: item.purchasedAt,
          items: [item],
        });
      }
    }

    return Array.from(groupsByOrderId.values()).sort((a, b) =>
      String(b.purchasedAt ?? '').localeCompare(String(a.purchasedAt ?? '')),
    );
  }

  async getPurchasedItems(): Promise<OrderItem[]> {
    const userId = await this.requireUserId();

    if (this.isWeb()) {
      const items = this.readWebOrders(userId).sort((a, b) =>
        String(b.purchasedAt).localeCompare(String(a.purchasedAt)),
      );
      return items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        amount: item.amount,
        priceAtPurchase: item.priceAtPurchase,
        name: item.name,
        image: item.image,
        purchased: true,
        purchasedAt: item.purchasedAt,
      }));
    }

    const rows = await this.sqlite.query<{
      id: string;
      user_id: string;
      order_id: string;
      product_id: string;
      amount: number;
      price_at_purchase: number;
      name: string;
      image: string;
      purchased_at: string;
    }>(
      `SELECT id, user_id, order_id, product_id, amount, price_at_purchase, name, image, purchased_at
       FROM purchase_history
       WHERE user_id = ?
       ORDER BY datetime(purchased_at) DESC`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      amount: Number(row.amount ?? 0),
      priceAtPurchase: Number(row.price_at_purchase ?? 0),
      name: row.name,
      image: row.image,
      purchased: true,
      purchasedAt: row.purchased_at,
    }));
  }

  async createOrder(items: OrderItem[]): Promise<void> {
    if (!items.length) {
      return;
    }

    const userId = await this.requireUserId();
    const orderId = this.generateOrderId();

    try {
      const supabaseUserId = await this.getAuthedSupabaseUserId();
      if (supabaseUserId) {
        await this.createSupabaseOrder(supabaseUserId, items);
      }
    } catch (e) {
      console.warn('[OrderService] createFirestoreOrder failed (non-fatal)', e);
    }

    if (this.isWeb()) {
      const now = new Date().toISOString();
      const existing = this.readWebOrders(userId);

      const newItems: WebOrderItem[] = items.map((item, index) => ({
        id: this.generateItemId(orderId, item.productId, index),
        orderId,
        productId: item.productId,
        amount: Math.max(1, Math.floor(item.amount ?? 1)),
        priceAtPurchase: Number(item.priceAtPurchase ?? 0),
        name: item.name ?? 'Unknown product',
        image: (item.image ?? 'assets/sampleimg/strawberry.jpg') as string,
        purchasedAt: now,
      }));

      const merged = [...newItems, ...existing].sort((a, b) =>
        String(b.purchasedAt).localeCompare(String(a.purchasedAt)),
      );
      this.writeWebOrders(userId, merged);
      return;
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const id = this.generateItemId(orderId, item.productId, index);

      await this.sqlite.run(
        `INSERT OR REPLACE INTO purchase_history (
           id, user_id, order_id, product_id, amount, price_at_purchase, name, image
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          orderId,
          item.productId,
          Math.max(1, Math.floor(item.amount ?? 1)),
          Number(item.priceAtPurchase ?? 0),
          item.name ?? 'Unknown product',
          (item.image ?? 'assets/sampleimg/strawberry.jpg') as string,
        ],
      );
    }
  }

  private async getAuthedSupabaseUserId(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.getUser();
      if (!error && data.user?.id) {
        return data.user.id;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private computeOrderTotal(items: OrderItem[]): number {
    return (items ?? []).reduce((sum, item) => {
      const q = Math.max(1, Math.floor(Number(item.amount ?? 1)));
      const p = Number(item.priceAtPurchase ?? 0);
      return sum + (Number.isFinite(p) ? p : 0) * q;
    }, 0);
  }

  private async createSupabaseOrder(userId: string, items: OrderItem[]): Promise<void> {
    const total = this.computeOrderTotal(items);

    const nowIso = new Date().toISOString();

    // 1) Create order row in Supabase
    const { data: orderRow, error: orderError } = await this.supabase.client
      .from('orders')
      .insert({
        user_id: userId,
        total_price: total,
        delivery_started_at: null,
        estimated_arrival_at: null,
        created_at: nowIso,
      })
      .select('order_id')
      .single();

    if (orderError) {
      console.error('[OrderService] createSupabaseOrder order insert error', orderError);
      throw orderError;
    }

    const orderId = String((orderRow as any)?.order_id ?? '');
    if (!orderId) {
      throw new Error('Order created but no order id returned');
    }

    // 2) Build base order_items payload
    const basePayload = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: Math.max(1, Math.floor(Number(item.amount ?? 1))),
      price_at_purchase: Number(item.priceAtPurchase ?? 0),
      is_gift: false,
    }));

    // 3) Attach promotion gifts based on promotion_items table
    const productIds = Array.from(new Set(items.map((i) => i.productId))).filter(Boolean);
    let giftPayload: Array<{ order_id: string; product_id: string; quantity: number; price_at_purchase: number; is_gift: boolean }> = [];

    if (productIds.length > 0) {
      try {
        const gifts: string[] = [];
        for (const idsChunk of this.chunk(productIds, 10)) {
          const { data: promoItems, error: promoError } = await this.supabase.client
            .from('promotion_items')
            .select('gift_product_id')
            .in('product_id', idsChunk);

          if (promoError) {
            console.warn('[OrderService] Failed to load promotion_items for gifts', promoError);
            continue;
          }

          for (const row of promoItems ?? []) {
            const giftProductId = String((row as any)?.gift_product_id ?? '');
            if (giftProductId) {
              gifts.push(giftProductId);
            }
          }
        }

        const uniqueGiftIds = Array.from(new Set(gifts));
        giftPayload = uniqueGiftIds.map((gid) => ({
          order_id: orderId,
          product_id: gid,
          quantity: 1,
          price_at_purchase: 0,
          is_gift: true,
        }));
      } catch (e) {
        console.warn('[OrderService] Failed to attach promotion gifts to order items', e);
      }
    }

    const orderItemsPayload = [...basePayload, ...giftPayload];

    if (!orderItemsPayload.length) {
      return;
    }

    const { error: itemsInsertError } = await this.supabase.client
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsInsertError) {
      console.error('[OrderService] createSupabaseOrder order_items insert error', itemsInsertError);
      throw itemsInsertError;
    }
  }

  private async getUserId(): Promise<string> {
    try {
      const { data, error } = await this.supabase.getUser();
      if (!error && data.user?.id) {
        return data.user.id;
      }
    } catch {
      // ignore and fall through to guest id
    }

    const key = 'cart:guest_id';
    if (typeof localStorage !== 'undefined') {
      let guestId = localStorage.getItem(key);
      if (!guestId) {
        guestId = 'guest-' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem(key, guestId);
      }
      return guestId;
    }

    return 'guest-static';
  }

  private async requireUserId(): Promise<string> {
    return this.getUserId();
  }

  private getWebOrdersKey(userId: string): string {
    return `orders:${userId}`;
  }

  private readWebOrders(userId: string): WebOrderItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.getWebOrdersKey(userId));
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item: any) => ({
          id: String(item?.id ?? ''),
          orderId: String(item?.orderId ?? ''),
          productId: String(item?.productId ?? ''),
          amount: Math.max(1, Math.floor(Number(item?.amount ?? 1))),
          priceAtPurchase: Number(item?.priceAtPurchase ?? 0),
          name: String(item?.name ?? ''),
          image: String(item?.image ?? ''),
          purchasedAt: String(item?.purchasedAt ?? ''),
        }))
        .filter((item) => !!item.id && !!item.productId && !!item.orderId);
    } catch {
      return [];
    }
  }

  private writeWebOrders(userId: string, items: WebOrderItem[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.getWebOrdersKey(userId), JSON.stringify(items));
  }

  private generateOrderId(): string {
    return 'order-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  private generateItemId(orderId: string, productId: string, index: number): string {
    return `${orderId}:${productId}:${index}`;
  }
}
