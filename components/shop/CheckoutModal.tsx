"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Truck, MapPin, Phone, User, CheckCircle2 } from "lucide-react";

import GlassModal from "@/components/ui/GlassModal";
import GlassButton from "@/components/ui/GlassButton";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    paymentMethod: "cod"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = items.map((item) => ({
        productId: item.product.product_id,
        amount: item.quantity,
        priceAtPurchase: item.product.price,
        name: item.product.name,
        image: item.product.images?.[0] || item.product.image || "",
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payload,
          userId: user?.id,
          customerInfo: formData
        }),
      });

      const data = await res.json().catch(() => ({ error: "Lỗi kết nối máy chủ" }));
      if (!res.ok) {
        toast.error("Lỗi đặt hàng", {
          description: data.error || data.details || "Thanh toán thất bại do hệ thống.",
        });
        return;
      }

      setStep("success");
      onSuccess(); // Clear cart items
      
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

  if (step === "success") {
    return (
      <GlassModal isOpen={isOpen} onClose={handleFinish} className="max-w-md">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="size-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 backdrop-blur-md">
            <CheckCircle2 className="size-10 text-primary" />
          </div>
          <h2 className="text-[28px] font-sans font-bold text-foreground mb-4 drop-shadow-sm tracking-tight">Đặt hàng thành công!</h2>
          <p className="text-[16px] text-muted-foreground mb-8 leading-[1.6]">
            Cảm ơn bạn đã mua sắm tại Shop Lưu Niệm Đà Lạt. Chúng tôi sẽ liên hệ với bạn qua số <strong>{formData.phone}</strong> để xác nhận đơn hàng trong thời gian sớm nhất.
          </p>
          <GlassButton variant="primary" className="w-full" onClick={handleFinish}>
            Tiếp tục mua sắm
          </GlassButton>
        </div>
      </GlassModal>
    );
  }

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
        
        {/* Left Column: Form */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <h2 className="text-[28px] md:text-[32px] font-sans font-bold text-foreground mb-6 drop-shadow-sm tracking-tight">
            Thông tin giao hàng
          </h2>
          
          <form id="checkout-form" onSubmit={submitOrder} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Họ và tên"
                  className="pl-11 bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 backdrop-blur-sm h-12 rounded-xl text-[16px]"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại"
                  type="tel"
                  className="pl-11 bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 backdrop-blur-sm h-12 rounded-xl text-[16px]"
                  required
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Địa chỉ giao hàng chi tiết"
                  className="pl-11 bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 backdrop-blur-sm h-12 rounded-xl text-[16px]"
                  required
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <h3 className="text-[20px] font-sans font-bold text-foreground mb-4 tracking-tight drop-shadow-sm">Phương thức thanh toán</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`cursor-pointer flex flex-col p-4 rounded-2xl border transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/10 shadow-md' : 'border-border/50 bg-background/50 hover:bg-background'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[16px] text-foreground">Thanh toán khi nhận hàng</span>
                    <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} className="accent-primary size-4" />
                  </div>
                  <span className="text-[14px] text-muted-foreground">Thanh toán bằng tiền mặt khi shipper giao hàng tới.</span>
                </label>

                <label className={`cursor-pointer flex flex-col p-4 rounded-2xl border transition-all ${formData.paymentMethod === 'transfer' ? 'border-primary bg-primary/10 shadow-md' : 'border-border/50 bg-background/50 hover:bg-background'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[16px] text-foreground">Chuyển khoản ngân hàng</span>
                    <input type="radio" name="paymentMethod" value="transfer" checked={formData.paymentMethod === 'transfer'} onChange={handleChange} className="accent-primary size-4" />
                  </div>
                  <span className="text-[14px] text-muted-foreground">Chuyển khoản trực tiếp qua ngân hàng. (Sẽ có nhân viên gọi xác nhận).</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:w-[380px] bg-background/40 dark:bg-background/10 border-t md:border-t-0 md:border-l border-border/50 p-6 md:p-8 flex flex-col">
          <h3 className="font-sans font-bold text-[24px] text-foreground mb-6 pb-4 border-b border-border/50 drop-shadow-sm tracking-tight">Đơn hàng của bạn</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-6">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="relative size-16 rounded-xl overflow-hidden border border-border/50 shrink-0 bg-background/50">
                  <img
                    src={item.product.images?.[0] ?? item.product.image ?? "https://picsum.photos/200"}
                    alt={item.product.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex flex-col flex-1 justify-center">
                  <p className="text-[15px] font-bold text-foreground line-clamp-2 leading-tight mb-1">{item.product.name}</p>
                  <p className="text-[14px] font-semibold text-secondary">{formatPrice(item.product.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border/50">
            <div className="space-y-3 mb-6 text-[15px]">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-primary">Miễn phí</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-8 pt-4 border-t border-border/50">
              <span className="text-[18px] font-bold text-foreground">Tổng cộng</span>
              <span className="text-[32px] font-sans font-bold text-secondary tracking-tight">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <GlassButton
              type="submit"
              form="checkout-form"
              variant="primary"
              className="w-full h-14 text-[16px] font-bold shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
