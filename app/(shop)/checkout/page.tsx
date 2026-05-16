"use client";



import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cartProductId } from "@/lib/cart-product-id";
import { authFetch } from "@/lib/auth-fetch";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";


const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

const checkoutSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ và tên"),
  phone: z.string().regex(/^\d{10}$/, "Số điện thoại phải gồm 10 số"),
  email: z.union([z.literal(""), z.string().email("Email không hợp lệ")]),
  province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  district: z.string().min(1, "Vui lòng nhập quận/huyện"),
  ward: z.string().min(1, "Vui lòng nhập phường/xã"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ cụ thể"),
  note: z.string().optional(),
  paymentMethod: z.enum(["cod", "vnpay"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Page() {
  const router = useRouter();
  const { items, totalPrice } = useCartStore();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [freeShip, setFreeShip] = useState(false);

  const shippingFee = freeShip ? 0 : totalPrice >= 500000 ? 0 : 30000;
  const finalTotal = totalPrice + shippingFee - couponDiscount;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      province: "",
      district: "",
      ward: "",
      address: "",
      note: "",
      paymentMethod: "cod",
    },
  });


  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login?redirect=/checkout");
    }
  }, [isInitialized, isLoggedIn, router]);

  const submitOrder = async (formData: CheckoutFormValues) => {
    try {
      // Prepare items for API
      const orderItems = items.map((item) => ({
        productId: item.product.product_id,
        amount: item.quantity,
        priceAtPurchase: item.product.price,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image || '',
      }));
      const res = await authFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: orderItems, 
          customerInfo: formData,
          couponCode,
        }),
      });
      
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (!res.ok) {
        alert(data.error || data.details || "Đặt hàng thất bại.");
        return;
      }


      clearCart();
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch {
      alert('Có lỗi xảy ra khi đặt hàng.');
    }
  };

  const applyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (normalized === "DALATSPECIAL") {
      const discount = Math.round(totalPrice * 0.1);
      setCouponDiscount(discount);
      setCouponMessage(`✓ Áp dụng thành công, tiết kiệm ${formatPrice(discount)}`);
      return;
    }
    if (normalized === "FREESHIP") {
      setFreeShip(true);
      setCouponMessage("✓ Áp dụng thành công, miễn phí vận chuyển");
      return;
    }
    setCouponDiscount(0);
    setFreeShip(false);
    setCouponMessage("Mã giảm giá không hợp lệ");
  };

  const emptyCart = useMemo(() => items.length === 0, [items.length]);

  if (emptyCart) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Chưa có sản phẩm để thanh toán</h1>
        <p className="mt-2 text-muted-foreground">Vui lòng thêm sản phẩm vào giỏ hàng trước.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[3fr_2fr]">
      <form onSubmit={handleSubmit(submitOrder)} className="space-y-4">
        <section className="rounded-xl border p-4">
          <h2 className="mb-4 text-lg font-semibold">1. Thông tin giao hàng</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Họ và tên *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Số điện thoại *</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Tỉnh/Thành phố *</Label>
              <Input {...register("province")} placeholder="Lâm Đồng / TP.HCM / Hà Nội..." />
              {errors.province && <p className="mt-1 text-xs text-destructive">{errors.province.message}</p>}
            </div>
            <div>
              <Label>Quận/Huyện *</Label>
              <Input {...register("district")} />
              {errors.district && <p className="mt-1 text-xs text-destructive">{errors.district.message}</p>}
            </div>
            <div>
              <Label>Phường/Xã *</Label>
              <Input {...register("ward")} />
              {errors.ward && <p className="mt-1 text-xs text-destructive">{errors.ward.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label>Địa chỉ cụ thể *</Label>
              <Input {...register("address")} placeholder="Số nhà, tên đường" />
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label>Ghi chú</Label>
              <Textarea {...register("note")} placeholder="Yêu cầu đặc biệt..." />
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="mb-4 text-lg font-semibold">2. Phương thức thanh toán</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="cursor-pointer rounded-lg border p-3 has-[input:checked]:border-primary">
              <input
                type="radio"
                value="cod"
                {...register("paymentMethod")}
                className="mr-2"
              />
              Thanh toán khi nhận hàng (COD)
            </label>
            <label className="cursor-pointer rounded-lg border p-3 has-[input:checked]:border-primary">
              <input
                type="radio"
                value="vnpay"
                {...register("paymentMethod")}
                className="mr-2"
              />
              Thanh toán online VNPay
            </label>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="mb-4 text-lg font-semibold">3. Mã giảm giá (nếu có)</h2>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="DALATSPECIAL hoặc FREESHIP"
            />
            <Button type="button" variant="outline" onClick={applyCoupon}>
              Áp dụng
            </Button>
          </div>
          {couponMessage && (
            <p
              className={`mt-2 text-sm ${
                couponMessage.startsWith("✓") ? "text-green-600" : "text-destructive"
              }`}
            >
              {couponMessage}
            </p>
          )}
        </section>

        <Button type="submit" className="h-10 w-full bg-primary text-white hover:bg-primary-dark">
          Đặt hàng ({formatPrice(finalTotal)}) →
        </Button>
      </form>

      <aside className="h-fit rounded-xl border p-4 lg:sticky lg:top-20">
        <h2 className="text-lg font-semibold">Đơn hàng của bạn</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={cartProductId(item.product)} className="flex items-center gap-2">
              <img
                src={item.product.images?.[0] ?? item.product.image ?? ""}
                alt={item.product.name}
                className="size-12 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
              </div>
              <p className="text-sm">{formatPrice(item.product.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <hr className="my-3" />
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span>Tạm tính</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Phí ship</span>
            <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span>Giảm giá</span>
              <span>-{formatPrice(couponDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 text-base font-semibold">
            <span>Tổng</span>
            <span className="text-primary">{formatPrice(finalTotal)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">🔒 An toàn | 🚚 Nhanh | 🔄 Đổi trả dễ</p>
      </aside>
    </div>
  );
}
