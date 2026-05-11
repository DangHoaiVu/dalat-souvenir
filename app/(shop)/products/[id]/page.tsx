import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import ProductDetailClient from "@/app/(shop)/products/[id]/ProductDetailClient";
import { fetchProductById, fetchRelatedProducts } from "@/lib/shop-data";

export const revalidate = 300;

const getProductByIdCached = cache(async (id: string) => fetchProductById(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductByIdCached(id);
  if (!product) {
    return { title: "Không tìm thấy sản phẩm" };
  }
  const img = product.images?.[0] ?? product.image ?? "";
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: img ? { images: [img] } : undefined,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductByIdCached(id);
  if (!product) notFound();

  const relatedProducts = await fetchRelatedProducts(
    product.category_id,
    product.product_id,
    4,
  );

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
