"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";

import ProductCard from "@/components/shop/ProductCard";
import { PRODUCTS } from "@/lib/mock-data";

export default function Page() {
  const [wishlist] = useState(PRODUCTS.slice(0, 4));

  if (wishlist.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center">
        <Heart className="mx-auto mb-2 size-10 text-muted-foreground" />
        <p className="font-medium">Chưa có sản phẩm yêu thích</p>
        <p className="text-sm text-muted-foreground">
          Khám phá và thêm những sản phẩm bạn thích vào đây
        </p>
        <Link href="/products" className="mt-3 inline-block text-primary hover:underline">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Sản phẩm yêu thích ({wishlist.length})</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {wishlist.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
}
