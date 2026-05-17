"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth-fetch";
import { cartProductId } from "@/lib/cart-product-id";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

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

const steps = ["Thông tin", "Thanh toán", "Xác nhận"];

export default function Page() {
  const router = useRouter();
  const { items, totalPrice } = useCartStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [freeShip, setFreeShip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) router.replace("/login?redirect=/checkout");
  }, [isInitialized, isLoggedIn, router]);

  const submitOrder = async (formData: CheckoutFormValues) => {
    try {
      setIsSubmitting(true);
      const orderItems = items.map((item) => ({
        productId: item.product.product_id,
        amount: item.quantity,
        priceAtPurchase: item.product.price,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image || "",
      }));

      const res = await authFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems, customerInfo: formData, couponCode }),
      });

      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (!res.ok) {
        alert(data.error || data.details || "Đặt hàng thất bại.");
        return;
      }

      clearCart();
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch {
      alert("Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (normalized === "DALATSPECIAL") {
      const discount = Math.round(totalPrice * 0.1);
      setCouponDiscount(discount);
      setCouponMessage(`Áp dụng thành công, tiết kiệm ${formatPrice(discount)}`);
      return;
    }
    if (normalized === "FREESHIP") {
      setFreeShip(true);
      setCouponMessage("Áp dụng thành công, miễn phí vận chuyển");
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
        <h1 className="text-2xl font-semibold text-primary">Chưa có sản phẩm để thanh toán</h1>
        <p className="mt-2 text-secondary">Vui lòng thêm sản phẩm vào giỏ hàng trước.</p>
      </div>
    );
  }

  const orderSummary = (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={cartProductId(item.product)} className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">
              <Image
                src={item.product.images?.[0] ?? item.product.image ?? "/placeholder.png"}
                alt={item.product.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-primary">{item.product.name}</p>
              <p className="text-xs text-tertiary">SL: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-primary">{formatPrice(item.product.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <hr className="my-4 border-[--color-border]" />
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-secondary">Tạm tính</span>
          <span className="text-primary">{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-secondary">Phí ship</span>
          <span className="text-primary">{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between text-success">
            <span>Giảm giá</span>
            <span>-{formatPrice(couponDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[--color-border] pt-3 text-base font-bold">
          <span className="text-primary">Tổng</span>
          <span className="text-accent">{formatPrice(finalTotal)}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Thanh toán</h1>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${index <= 1 ? "bg-accent text-white" : "bg-surface-muted text-tertiary"}`}>
                {index + 1}
              </span>
              <span className={`hidden text-sm font-semibold sm:inline ${index <= 1 ? "text-accent" : "text-tertiary"}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={handleSubmit(submitOrder)} className="space-y-4">
          <details className="rounded-lg border border-[--color-border] bg-surface p-4 shadow-card lg:hidden">
            <summary className="cursor-pointer text-base font-semibold text-primary">
              Đơn hàng của bạn: {formatPrice(finalTotal)}
            </summary>
            <div className="mt-4">{orderSummary}</div>
          </details>

          <Card variant="flat" className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-primary">1. Thông tin giao hàng</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <InputField label="Họ và tên *" errorMessage={errors.name?.message} wrapperClassName="md:col-span-2" {...register("name")} />
              <InputField label="Số điện thoại *" errorMessage={errors.phone?.message} {...register("phone")} />
              <InputField label="Email" type="email" errorMessage={errors.email?.message} {...register("email")} />
              <InputField label="Tỉnh/Thành phố *" placeholder="Lâm Đồng / TP.HCM / Hà Nội..." errorMessage={errors.province?.message} {...register("province")} />
              <InputField label="Quận/Huyện *" errorMessage={errors.district?.message} {...register("district")} />
              <InputField label="Phường/Xã *" errorMessage={errors.ward?.message} {...register("ward")} />
              <InputField label="Địa chỉ cụ thể *" placeholder="Số nhà, tên đường" errorMessage={errors.address?.message} wrapperClassName="md:col-span-2" {...register("address")} />
              <div className="md:col-span-2">
                <Label>Ghi chú</Label>
                <Textarea {...register("note")} placeholder="Yêu cầu đặc biệt..." className="min-h-24 bg-surface text-base" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-primary">2. Phương thức thanh toán</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="cursor-pointer rounded-lg border border-[--color-border] p-4 text-primary transition has-[input:checked]:border-accent has-[input:checked]:bg-accent-light">
                <input type="radio" value="cod" {...register("paymentMethod")} className="mr-2" />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className="cursor-pointer rounded-lg border border-[--color-border] p-4 text-primary transition has-[input:checked]:border-accent has-[input:checked]:bg-accent-light">
                <input type="radio" value="vnpay" {...register("paymentMethod")} className="mr-2" />
                Thanh toán online VNPay
              </label>
            </div>
          </Card>

          <Card variant="flat" className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-primary">3. Mã giảm giá</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <InputField
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="DALATSPECIAL hoặc FREESHIP"
                wrapperClassName="flex-1"
              />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Áp dụng
              </Button>
            </div>
            {couponMessage && (
              <p className={`mt-2 text-sm ${couponMessage.includes("thành công") ? "text-success" : "text-error"}`}>
                {couponMessage}
              </p>
            )}
          </Card>

          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
            Đặt hàng ({formatPrice(finalTotal)})
          </Button>
        </form>

        <aside className="hidden h-fit rounded-lg border border-[--color-border] bg-surface p-4 shadow-card lg:sticky lg:top-24 lg:block">
          <h2 className="text-lg font-semibold text-primary">Đơn hàng của bạn</h2>
          <div className="mt-4">{orderSummary}</div>
          <p className="mt-4 text-xs text-tertiary">An toàn | Giao nhanh | Đổi trả dễ</p>
        </aside>
      </div>
    </div>
  );
}
