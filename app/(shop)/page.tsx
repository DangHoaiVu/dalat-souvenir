import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Gift,
  Leaf,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import {
  fetchActivePromotion,
  fetchCategoriesForHome,
  fetchProductsForHome,
  pickNewestProducts,
  pickRandomProducts,
} from "@/lib/shop-data";

export const revalidate = 300;

const categoryDescriptions = [
  "Những món quà gọn nhẹ, dễ mang theo và đậm dấu ấn thành phố sương mù.",
  "Đặc sản tuyển chọn cho gia đình, đồng nghiệp và những dịp cần chỉn chu.",
  "Sản phẩm thủ công nhỏ xinh, tinh tế và có câu chuyện riêng.",
  "Bộ quà tặng được phối sẵn, phù hợp biếu tặng và lưu niệm.",
];

const categoryIcons = [Gift, Coffee, Leaf, Sparkles];

export default async function Page() {
  const categories = await fetchCategoriesForHome();
  const allProducts = await fetchProductsForHome();
  const featuredProducts = pickRandomProducts(allProducts, 8);
  const newProducts = pickNewestProducts(allProducts, 8);
  const activePromotion = await fetchActivePromotion();

  const heroImage =
    activePromotion?.image ||
    "https://images.unsplash.com/photo-1596706037042-45e0d37e2ab7?auto=format&fit=crop&q=90&w=2070";
  const heroTitle = activePromotion?.name || "Mang hương vị Đà Lạt về nhà";
  const heroDescription =
    activePromotion?.description ||
    "Khám phá đặc sản, quà lưu niệm và sản phẩm thủ công được tuyển chọn từ thành phố sương mù.";
  const categoryCards = categories.slice(0, 4);

  return (
    <>
      <link rel="preload" as="image" href={heroImage} />
      <div className="min-h-screen text-secondary">
        <section className="relative overflow-hidden bg-gradient-to-br from-sky-500 to-sky-700 text-white">
          <div className="pointer-events-none absolute -left-16 top-16 size-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-10 right-10 size-72 rounded-full bg-white/10" />
          <div className="mx-auto grid min-h-[calc(100svh-64px)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.54fr)_minmax(360px,0.46fr)] lg:px-8">
            <div className="hero-fade-up max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
                Đặc sản & quà tặng Đà Lạt
              </p>
              <h1 className="mt-5 text-white">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-[1.75] text-sky-50 sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={activePromotion ? `/promotions/${activePromotion.promotion_id}` : "/products"}
                  className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-bold text-sky-700 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {activePromotion ? "Săn ưu đãi" : "Khám phá ngay"}
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/products?category=qua-tang"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/70 px-6 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/12"
                >
                  Xem bộ quà tặng
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: "Tuyển chọn kỹ" },
                  { icon: Truck, label: "Giao toàn quốc" },
                  { icon: RotateCcw, label: "Hỗ trợ đổi trả" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex min-h-11 items-center gap-2 rounded-md border border-white/25 bg-white/12 px-4 backdrop-blur">
                    <Icon className="size-4 text-white" aria-hidden="true" />
                    <span className="font-medium text-white">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-xl border border-white/25 bg-white/10 shadow-lg">
                <Image
                  src={heroImage}
                  alt="Đà Lạt và các sản phẩm quà tặng được tuyển chọn"
                  width={760}
                  height={620}
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="h-[320px] w-full object-cover sm:h-[440px]"
                />
              </div>
              <div className="absolute -bottom-5 left-5 rounded-lg border border-white/35 bg-white/90 px-4 py-3 text-sm shadow-md backdrop-blur">
                <p className="font-semibold text-sky-800">Quà theo mùa</p>
                <p className="text-sky-700">Đóng gói chỉn chu</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Danh mục</p>
                <h2 className="mt-2 text-primary">Chọn quà theo nhu cầu</h2>
              </div>
              <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent">
                Xem tất cả
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {categoryCards.map((category, index) => {
                const Icon = categoryIcons[index] ?? Sparkles;
                return (
                  <Link
                    key={category.category_id ?? category.name}
                    href={`/products?category=${category.slug ?? ""}`}
                    className="group rounded-lg border border-[--color-border] bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-md"
                  >
                    <div className="mb-6 inline-flex size-11 items-center justify-center rounded-lg bg-accent-light text-accent">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-primary sm:text-lg">{category.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-secondary">
                      {categoryDescriptions[index] ?? categoryDescriptions[0]}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {activePromotion && (
          <section className="bg-background-soft px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-6 rounded-xl border border-[--color-border] bg-surface p-6 shadow-card md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Khuyến mãi đặc biệt</p>
                <h2 className="mt-2 text-primary">{activePromotion.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">{activePromotion.description}</p>
              </div>
              <Link
                href={`/promotions/${activePromotion.promotion_id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-md"
              >
                Nhận ưu đãi ngay
              </Link>
            </div>
          </section>
        )}

        <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sản phẩm nổi bật</p>
                <h2 className="mt-2 text-primary">Quà được yêu thích</h2>
              </div>
              <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent">
                Xem tất cả
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[--color-border] bg-surface px-6 py-12 text-center">
                <PackageCheck className="mx-auto size-10 text-accent" aria-hidden="true" />
                <p className="mt-3 text-sm text-secondary">Chưa có sản phẩm.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-background-soft px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Mới nhất</p>
              <h2 className="mt-2 text-primary">Vừa lên kệ</h2>
            </div>
            {newProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {newProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-secondary">Chưa có sản phẩm mới.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
