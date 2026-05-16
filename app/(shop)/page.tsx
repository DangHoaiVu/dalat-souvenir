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
];

const categoryIcons = [Gift, Coffee, Leaf];

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
  const showcaseProducts = featuredProducts.slice(0, 2);
  const categoryCards = categories.slice(0, 3);

  return (
    <>
      <link rel="preload" as="image" href={heroImage} />
      <div className="min-h-screen text-[var(--color-text-secondary)]">
        <section className="section-shell border-b border-[var(--color-border)]">
          <div className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(360px,0.42fr)] lg:px-8">
            <div className="hero-fade-up max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                Đặc sản & quà tặng Đà Lạt
              </p>
              <h1 className="mt-5 max-w-2xl text-[var(--color-text-primary)]">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-[1.75] text-[var(--color-text-secondary)] sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={activePromotion ? `/promotions/${activePromotion.promotion_id}` : "/products"}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-hover)]"
                >
                  {activePromotion ? "Săn ưu đãi" : "Khám phá ngay"}
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/products?category=qua-tang"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-warm-light)]"
                >
                  Xem bộ quà tặng
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-[var(--color-text-primary)] sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: "Tuyển chọn kỹ" },
                  { icon: Truck, label: "Giao toàn quốc" },
                  { icon: RotateCcw, label: "Hỗ trợ đổi trả" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 shadow-[var(--shadow-sm)]">
                    <Icon className="size-4 text-[var(--color-warm)]" aria-hidden="true" />
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
                  <Image
                    src={heroImage}
                    alt="Đà Lạt và các sản phẩm quà tặng được tuyển chọn"
                    width={760}
                    height={520}
                    priority
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="h-[260px] w-full object-cover transition-transform duration-300 ease-in-out hover:scale-[1.035] sm:h-[340px]"
                  />
                </div>
                {showcaseProducts.map((product) => {
                  const imageSrc = Array.isArray(product.images) && product.images[0]
                    ? product.images[0]
                    : product.image || "/placeholder.png";

                  return (
                    <Link
                      key={product.product_id}
                      href={`/products/${product.product_id}`}
                      className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
                    >
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        width={360}
                        height={300}
                        loading="lazy"
                        sizes="(min-width: 1024px) 20vw, 50vw"
                        className="h-40 w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.04]"
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="absolute -bottom-5 left-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-sm shadow-[var(--shadow-sm)] backdrop-blur-xl">
                <p className="font-semibold text-[var(--color-text-primary)]">Quà theo mùa</p>
                <p className="text-[var(--color-text-secondary)]">Đóng gói chỉn chu</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                Danh mục
              </p>
              <h2 className="mt-2 text-[var(--color-text-primary)]">Chọn quà theo nhu cầu</h2>
            </div>
            <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-accent)]">
              Xem tất cả
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryCards.map((category, index) => {
              const Icon = categoryIcons[index] ?? Sparkles;
              return (
                <Link
                  key={category.category_id ?? category.name}
                  href={`/products?category=${category.slug ?? ""}`}
                  className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] transition duration-200 ease-in-out hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-md)]"
                >
                  <div className="mb-8 inline-flex size-12 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{category.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                        {categoryDescriptions[index] ?? categoryDescriptions[0]}
                      </p>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-[var(--color-accent)] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {activePromotion && (
          <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-accent-light)] p-6 shadow-[var(--shadow-sm)] md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                  Khuyến mãi đặc biệt
                </p>
                <h2 className="mt-2 text-[var(--color-text-primary)]">{activePromotion.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{activePromotion.description}</p>
              </div>
              <Link
                href={`/promotions/${activePromotion.promotion_id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition duration-150 ease-in-out hover:-translate-y-px hover:bg-[var(--color-accent-hover)]"
              >
                Nhận ưu đãi ngay
              </Link>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                Sản phẩm nổi bật
              </p>
              <h2 className="mt-2 text-[var(--color-text-primary)]">Quà được yêu thích</h2>
            </div>
            <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-accent)]">
              Xem tất cả
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
              <PackageCheck className="mx-auto size-10 text-[var(--color-accent)]" aria-hidden="true" />
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Chưa có sản phẩm.</p>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
              Mới nhất
            </p>
            <h2 className="mt-2 text-[var(--color-text-primary)]">Vừa lên kệ</h2>
          </div>
          {newProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {newProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  showStory={false}
                  showCategory={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--color-text-secondary)]">Chưa có sản phẩm mới.</p>
          )}
        </section>
      </div>
    </>
  );
}
