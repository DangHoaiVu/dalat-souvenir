import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Coffee,
  Gift,
  Heart,
  Leaf,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TreePine,
  Truck,
} from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import PromotionPopup from "@/components/shop/PromotionPopup";
import {
  fetchActivePromotion,
  fetchCategoriesForHome,
  fetchProductsForHome,
  pickNewestProducts,
  pickRandomProducts,
} from "@/lib/shop-data";

export const revalidate = 0;

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

  const heroImage = "https://sacotravel.com/wp-content/uploads/2023/03/Da-Lat.jpg";
  const heroProductShowcase = [...featuredProducts, ...newProducts]
    .filter((product, index, products) => {
      const image = product.images?.[0] || product.image;
      const firstIndex = products.findIndex((item) => item.product_id === product.product_id);
      return Boolean(image) && firstIndex === index;
    })
    .slice(0, 3);
  const mainHeroProduct = heroProductShowcase[0];
  const mainHeroImage = heroImage;
  const secondaryHeroProducts = heroProductShowcase.slice(1, 3);
  const heroTitle = "Mang hương vị Đà Lạt về nhà";
  const heroDescription =
    "Khám phá đặc sản, quà lưu niệm và sản phẩm thủ công được tuyển chọn từ thành phố sương mù.";
  const categoryCards = categories.slice(0, 4);

  return (
    <>
      <link rel="preload" as="image" href={heroImage} />
      <div className="min-h-screen text-secondary">
        <PromotionPopup promotion={activePromotion} />
        <section className="hero-gradient-scene relative overflow-hidden text-white">
          <div className="hero-light-sweep pointer-events-none absolute inset-0" />
          <TreePine className="hero-float-slow pointer-events-none absolute left-5 top-24 size-36 -rotate-12 text-white/10 sm:size-44 lg:left-12 lg:top-28" aria-hidden="true" />
          <Heart className="hero-float-soft pointer-events-none absolute bottom-24 left-[42%] size-20 rotate-12 text-white/10 sm:size-28" aria-hidden="true" />
          <TreePine className="hero-float-soft pointer-events-none absolute bottom-10 right-8 size-52 rotate-6 text-white/10 sm:size-72" aria-hidden="true" />
          <Heart className="hero-float-slow pointer-events-none absolute right-[18%] top-28 size-16 -rotate-12 text-white/12 sm:size-24" aria-hidden="true" />
          <div className="hero-watermark pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 select-none text-center text-5xl font-black uppercase tracking-[0.18em] text-white/[0.07] sm:block lg:text-7xl">
            lovehoaivulover
          </div>
          <div className="mx-auto grid min-h-[calc(100svh-64px)] max-w-[1680px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.54fr)_minmax(360px,0.46fr)] lg:px-10 2xl:px-12">
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
                  href="/products"
                  className="home-cta-shine inline-flex min-h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-bold text-sky-700 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Khám phá ngay
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/products?category=qua-tang"
                  className="home-cta-shine inline-flex min-h-12 items-center justify-center rounded-md border border-white/70 px-6 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/12"
                >
                  Xem bộ quà tặng
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: "Tuyển chọn kỹ" },
                  { icon: Truck, label: "Giao toàn quốc" },
                  { icon: RotateCcw, label: "Hỗ trợ đổi trả" },
                ].map(({ icon: Icon, label }, index) => (
                  <div
                    key={label}
                    className="hero-benefit-card flex min-h-11 items-center gap-2 rounded-md border border-white/25 bg-white/12 px-4 backdrop-blur"
                    style={{ animationDelay: `${180 + index * 90}ms` }}
                  >
                    <Icon className="size-4 text-white" aria-hidden="true" />
                    <span className="font-medium text-white">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hero-fade-up">
              <div className="hero-image-float relative overflow-hidden rounded-xl border border-white/25 bg-white/[0.14] p-3 shadow-2xl backdrop-blur">
                <div className="relative h-[330px] overflow-hidden rounded-lg bg-white/10 sm:h-[460px]">
                  <Image
                    src={mainHeroImage}
                    alt={mainHeroProduct?.name || "Sản phẩm quà tặng Đà Lạt được tuyển chọn"}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="hero-image-zoom object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/58 via-transparent to-white/10" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
                      Gợi ý quà tặng
                    </p>
                    <p className="mt-1 line-clamp-2 text-xl font-bold text-white drop-shadow">
                      {mainHeroProduct?.name || "Bộ quà Đà Lạt được tuyển chọn"}
                    </p>
                  </div>
                </div>
              </div>
              {secondaryHeroProducts.length > 0 && (
                <div className="absolute -bottom-6 left-5 right-5 grid grid-cols-2 gap-3 sm:left-8 sm:right-auto sm:w-[72%]">
                  {secondaryHeroProducts.map((product, index) => (
                    <div
                      key={product.product_id}
                      className="hero-chip-float flex items-center gap-3 rounded-lg border border-white/35 bg-white/90 p-2 text-sky-900 shadow-lg backdrop-blur"
                      style={{ animationDelay: `${index * 260}ms` }}
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-sky-50">
                        <Image
                          src={product.images?.[0] || product.image || heroImage}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-xs font-bold">{product.name}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-sky-700">Đóng gói chỉn chu</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="home-section-reveal bg-background px-4 py-16 sm:px-6 lg:px-10 2xl:px-12">
          <div className="mx-auto max-w-[1680px]">
            <div className="home-heading-reveal mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Danh mục</p>
                <h2 className="mt-2 text-primary">Chọn quà theo nhu cầu</h2>
              </div>
              <Link href="/products" className="home-text-link inline-flex min-h-11 items-center text-sm font-semibold text-accent">
                Xem tất cả
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {categoryCards.map((category, index) => {
                const Icon = categoryIcons[index] ?? Sparkles;
                return (
                  <Link
                    key={category.category_id ?? category.name}
                    href={`/products?category=${category.slug ?? ""}`}
                    className="home-card-rise group rounded-lg border border-[--color-border] bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-md"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="home-category-icon mb-6 inline-flex size-11 items-center justify-center rounded-lg bg-accent-light text-accent">
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

        <section className="home-section-reveal bg-background px-4 py-16 sm:px-6 lg:px-10 2xl:px-12">
          <div className="mx-auto max-w-[1680px]">
            <div className="home-heading-reveal mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sản phẩm nổi bật</p>
                <h2 className="mt-2 text-primary">Quà được yêu thích</h2>
              </div>
              <Link href="/products" className="home-text-link inline-flex min-h-11 items-center text-sm font-semibold text-accent">
                Xem tất cả
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {featuredProducts.slice(0, 8).map((product, index) => (
                  <div key={product.product_id} className="home-card-rise h-full" style={{ animationDelay: `${index * 55}ms` }}>
                    <ProductCard product={product} className="border-[--color-border-strong] shadow-md hover:border-accent/60" />
                  </div>
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

        <section className="home-section-reveal bg-background-soft px-4 py-16 sm:px-6 lg:px-10 2xl:px-12">
          <div className="mx-auto max-w-[1680px]">
            <div className="home-heading-reveal mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Mới nhất</p>
              <h2 className="mt-2 text-primary">Vừa lên kệ</h2>
            </div>
            {newProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {newProducts.slice(0, 4).map((product, index) => (
                  <div key={product.product_id} className="home-card-rise h-full" style={{ animationDelay: `${index * 70}ms` }}>
                    <ProductCard product={product} className="border-[--color-border-strong] shadow-md hover:border-accent/60" />
                  </div>
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
