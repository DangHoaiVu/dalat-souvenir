"use client";

import dynamic from "next/dynamic";

import { useCartStore } from "@/stores/cartStore";

const CartDrawer = dynamic(() => import("@/components/shop/CartDrawer"), {
  ssr: false,
});

export default function CartDrawerMount() {
  const isOpen = useCartStore((state) => state.isOpen);

  if (!isOpen) {
    return null;
  }

  return <CartDrawer />;
}
