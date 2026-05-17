"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import GlassModal from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/auth-fetch";
import { isSupabaseProductId } from "@/lib/product-id";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onSuccess: () => void;
}

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  totalPrice,
  onSuccess,
}: CheckoutModalProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const removeItem = useCartStore((state) => state.removeItem);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderMeta, setOrderMeta] = useState<{ orderId: string; code: string } | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    paymentMethod: "cod",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    try {
      setIsSubmitting(true);
      const invalidItems = items.filter((item) => !isSupabaseProductId(item.product.product_id));
      if (invalidItems.length > 0) {
        invalidItems.forEach((item) => removeItem(item.product.product_id));
        toast.error("Giỏ hàng có sản phẩm cũ không còn hợp lệ", {
          description: "Mình đã xóa sản phẩm mẫu khỏi giỏ. Vui lòng thêm lại sản phẩm từ danh sách hiện tại rồi đặt hàng.",
        });
        return;
      }

      const payload = items.map((item) => ({
        productId: item.product.product_id,
        amount: item.quantity,
        priceAtPurchase: item.product.price,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image || "",
      }));

      const res = await authFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload, customerInfo: formData }),
      });

      const data = await res.json().catch(() => ({ error: "Lỗi kết nối máy chủ" }));
      if (!res.ok) {
        toast.error("Lỗi đặt hàng", {
          description: data.error || data.details || "Thanh toán thất bại do hệ thống.",
        });
        return;
      }

      setOrderMeta({
        orderId: String(data.orderId ?? ""),
        code: String(data.code || data.orderId || ""),
      });
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
      setStep("success");
      onSuccess();
    } catch (error) {
      console.error("Order submit error:", error);
      toast.error("Đã xảy ra lỗi hệ thống.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setStep("form");
    onClose();
    router.push("/products");
  };

  const handleViewOrders = () => {
    setStep("form");
    onClose();
    router.push(orderMeta?.orderId ? `/account/orders?orderId=${encodeURIComponent(orderMeta.orderId)}` : "/account/orders");
  };

  if (step === "success") {
    return (
      <GlassModal isOpen={isOpen} onClose={handleFinish} className="max-w-md">
        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-success-light text-success">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-primary">Đặt hàng thành công</h2>
          <p className="mb-8 text-base leading-7 text-secondary">
            Cảm ơn bạn đã mua sắm tại Shop Lưu Niệm Đà Lạt. Chúng tôi sẽ liên hệ qua số{" "}
            <strong>{formData.phone}</strong> để xác nhận đơn hàng sớm nhất.
          </p>
          {orderMeta?.code && (
            <div className="mb-6 w-full rounded-lg border border-[--color-border] bg-surface-muted p-3 text-sm text-secondary">
              Mã đơn hàng: <span className="font-bold text-primary">{orderMeta.code}</span>
            </div>
          )}
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button variant="outline" className="w-full" onClick={handleViewOrders}>
              Xem lịch sử đơn
            </Button>
            <Button className="w-full" onClick={handleFinish}>
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </GlassModal>
    );
  }

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="flex max-h-[85vh] flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">Thông tin giao hàng</h2>

          <form id="checkout-form" onSubmit={submitOrder} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tertiary" />
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Họ và tên" className="pl-11" required />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tertiary" />
                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại" type="tel" className="pl-11" required />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tertiary" />
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ giao hàng chi tiết" className="pl-11" required />
              </div>
            </div>

            <div className="border-t border-[--color-border] pt-6">
              <h3 className="mb-4 text-xl font-bold text-primary">Phương thức thanh toán</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { value: "cod", title: "Thanh toán khi nhận hàng", description: "Thanh toán bằng tiền mặt khi shipper giao hàng tới." },
                  { value: "vnpay", title: "Chuyển khoản ngân hàng", description: "Chuyển khoản trực tiếp qua ngân hàng. Nhân viên sẽ gọi xác nhận." },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-all ${
                      formData.paymentMethod === method.value
                        ? "border-accent bg-accent-light shadow-sm"
                        : "border-[--color-border] bg-surface hover:bg-surface-muted"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-primary">{method.title}</span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={handleChange}
                        className="size-4 accent-[--color-accent]"
                      />
                    </div>
                    <span className="text-sm text-secondary">{method.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-col border-t border-[--color-border] bg-surface-muted p-6 md:w-[380px] md:border-l md:border-t-0 md:p-8">
          <h3 className="mb-6 border-b border-[--color-border] pb-4 text-2xl font-bold text-primary">Đơn hàng của bạn</h3>

          <div className="mb-6 flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {items.map((item) => (
              <div key={item.product.product_id} className="flex gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-[--color-border] bg-surface">
                  <Image
                    src={item.product.images?.[0] ?? item.product.image ?? "https://picsum.photos/200"}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="line-clamp-2 text-sm font-bold leading-tight text-primary">{item.product.name}</p>
                  <p className="text-sm font-semibold text-accent">{formatPrice(item.product.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[--color-border] pt-6">
            <div className="mb-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-secondary">
                <span>Tạm tính</span>
                <span className="font-semibold text-primary">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-secondary">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-accent">Miễn phí</span>
              </div>
            </div>

            <div className="mb-8 flex items-end justify-between border-t border-[--color-border] pt-4">
              <span className="text-lg font-bold text-primary">Tổng cộng</span>
              <span className="text-3xl font-bold text-accent">{formatPrice(totalPrice)}</span>
            </div>

            <Button type="submit" form="checkout-form" size="lg" className="w-full" disabled={isSubmitting} isLoading={isSubmitting}>
              Xác nhận đặt hàng
            </Button>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
