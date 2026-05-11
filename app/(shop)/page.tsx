import ProductCard from "@/components/shop/ProductCard";
import LiquidGlassPanel from "@/components/ui/LiquidGlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 300;
import {
  fetchCategoriesForHome,
  fetchProductsForHome,
  pickNewestProducts,
  pickRandomProducts,
  fetchActivePromotion,
} from "@/lib/shop-data";

export default async function Page() {
  const categories = await fetchCategoriesForHome();
  const allProducts = await fetchProductsForHome();
  const featuredProducts = pickRandomProducts(allProducts, 8); // increased to 8 for better grid
  const newProducts = pickNewestProducts(allProducts, 8);
  const activePromotion = await fetchActivePromotion();

  const heroImage = activePromotion?.image || "https://images.unsplash.com/photo-1596706037042-45e0d37e2ab7?auto=format&fit=crop&q=80&w=2070";
  const heroTitle = activePromotion?.name || "Bring Home the Spirit of Da Lat";
  const heroDescription = activePromotion?.description || "Authentic souvenirs, handcrafted with love from the misty highlands. Minimal, timeless, and strictly curated.";

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image & Fallback */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2c402e] to-[#1a261c]">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-80"
          />
          {/* Gradient overlay for readability and "mood" */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/10" />
        </div>

        {/* Content using Liquid Glass Panel */}
        <div className="relative z-10 w-full max-w-5xl px-6 lg:px-8 flex flex-col items-center text-center mt-16">
          <div className="w-full">
            <LiquidGlassPanel variant="hero" className="rounded-[36px] p-8 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/20">
              <div className="flex flex-col items-center">
                {!activePromotion && (
                  <Badge className="mb-8 bg-white/20 text-white backdrop-blur-md gap-3 py-2 px-6 border border-white/30 uppercase tracking-[0.25em] text-xs font-bold shadow-lg">
                    <div className="size-2 rounded-full bg-secondary animate-pulse" />
                    Đặc sản & Quà tặng
                  </Badge>
                )}
                
                <h1 className="text-[48px] md:text-[56px] lg:text-[72px] font-sans font-bold leading-[1.1] text-white max-w-4xl drop-shadow-2xl tracking-tight">
                  {heroTitle}
                </h1>
                
                <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] text-white/90 font-medium leading-[1.7] drop-shadow-md">
                  {heroDescription}
                </p>
                
                <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center justify-center w-full sm:w-auto">
                  {activePromotion ? (
                    <Link href={`/promotions/${activePromotion.promotion_id}`} className="w-full sm:w-auto">
                      <GlassButton variant="primary" className="w-full">
                        Săn ngay ưu đãi
                      </GlassButton>
                    </Link>
                  ) : (
                    <Link href="/products" className="w-full sm:w-auto">
                      <GlassButton variant="primary" className="w-full">
                        Khám phá ngay
                      </GlassButton>
                    </Link>
                  )}
                  {!activePromotion && (
                    <Link href="/products?category=qua-tang" className="w-full sm:w-auto">
                      <GlassButton variant="secondary" className="w-full">
                        Xem bộ quà tặng
                      </GlassButton>
                    </Link>
                  )}
                </div>
              </div>
            </LiquidGlassPanel>
          </div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="relative z-20 mx-auto max-w-7xl px-6 lg:px-8 py-20 -mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.category_id ?? category.name}
              href={`/products?category=${category.slug ?? ""}`}
              className="block group h-40 md:h-48"
            >
              <GlassCard interactive className="size-full flex flex-col items-center justify-center p-4">
                <div className="absolute inset-0 bg-white/20 group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-12 rounded-full bg-white/50 backdrop-blur-md border border-white/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500">
                    <span className="text-primary text-xl drop-shadow-sm">✨</span>
                  </div>
                  <p className="text-[18px] font-sans font-bold tracking-tight group-hover:text-primary transition-colors text-foreground drop-shadow-sm">{category.name}</p>
                  <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground bg-background/40 dark:bg-background/20 px-3 py-1 rounded-full">
                    {category.productCount ?? 0} sản phẩm
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* PROMOTION BANNER (If Active) */}
      {activePromotion && (
        <section className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
          <LiquidGlassPanel variant="card" className="rounded-3xl border border-white/40 shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-primary/80 to-primary/60 px-8 py-14 text-white md:px-16 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/20 blur-3xl mix-blend-overlay" />
              <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-secondary/30 blur-3xl mix-blend-overlay" />
              
              <div className="relative z-10 max-w-xl text-center md:text-left">
                <Badge className="mb-4 bg-white/20 backdrop-blur-md text-white border border-white/40 uppercase tracking-[0.2em] text-[11px] font-bold py-1.5 px-4 shadow-sm">Khuyến mãi đặc biệt</Badge>
                <h2 className="text-[32px] md:text-[40px] font-sans font-bold leading-[1.1] drop-shadow-lg tracking-tight">{activePromotion.name}</h2>
                <p className="mt-4 text-white/90 text-[16px] drop-shadow-sm font-medium leading-[1.6]">{activePromotion.description}</p>
              </div>
              
              <div className="relative z-10 shrink-0">
                <Link href={`/promotions/${activePromotion.promotion_id}`}>
                  <GlassButton variant="secondary" className="bg-white/80 text-primary hover:bg-white border-none shadow-xl hover:shadow-2xl hover:shadow-white/20">
                    Nhận ưu đãi ngay
                  </GlassButton>
                </Link>
              </div>
            </div>
          </LiquidGlassPanel>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold tracking-[0.25em] text-secondary uppercase mb-3 drop-shadow-sm">Bộ sưu tập</p>
            <h2 className="text-[32px] md:text-[40px] font-sans font-bold text-foreground drop-shadow-sm tracking-tight leading-[1.1]">Sản phẩm nổi bật</h2>
          </div>
          <Link href="/products" className="text-sm font-bold tracking-wide text-primary hover:text-secondary transition-colors inline-flex items-center gap-2">
            Xem tất cả <span className="text-lg">→</span>
          </Link>
        </div>
        
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-center justify-center py-20 bg-white/30 rounded-3xl border border-dashed border-white/50">
            <p className="text-4xl mb-4 drop-shadow-sm">🌿</p>
            <p className="text-lg font-serif text-muted-foreground font-medium">Chưa có sản phẩm.</p>
          </GlassCard>
        )}
      </section>

      {/* BRAND STORY */}
      <section id="story" className="relative my-10 py-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-primary/90 z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596706037042-45e0d37e2ab7?auto=format&fit=crop&q=80')] bg-cover bg-fixed bg-center opacity-20 mix-blend-overlay z-0" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] md:aspect-square w-full rounded-[36px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)] transform md:-rotate-2 hover:rotate-0 transition-transform duration-700 border border-white/20">
            <Image
              src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80"
              alt="Câu chuyện Shop Lưu Niệm Đà Lạt"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-xl">
            <Badge className="mb-6 bg-white/20 text-white backdrop-blur-md border border-white/40 uppercase tracking-[0.2em] text-[11px] font-bold py-2 px-5 shadow-lg">
              Câu chuyện của chúng tôi
            </Badge>
            <h2 className="text-[32px] md:text-[48px] font-sans font-bold leading-[1.1] tracking-tight mb-6 drop-shadow-lg">Từ chuyến đi đến<br/>món quà ý nghĩa</h2>
            <p className="text-[16px] leading-[1.7] text-white/90 mb-10 font-medium drop-shadow-sm">
              Shop Lưu Niệm Đà Lạt chọn những món quà nhỏ, dễ thương và dễ mang theo:
              từ postcard, móc khóa đến túi vải, đồ len và các set quà kỷ niệm. Mỗi món
              được tinh tuyển để giữ lại một chút không khí dịu dàng của Đà Lạt sau chuyến đi,
              mang theo tinh thần nguyên bản và sự tỉ mỉ của người thợ thủ công.
            </p>
            <Link href="/story">
              <GlassButton variant="secondary" className="bg-white/20 text-white border-white/40 hover:bg-white/30">
                Đọc thêm về hành trình
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="group rounded-3xl bg-card p-10 text-center shadow-sm border border-border/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
            <div className="mx-auto size-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
              <p className="text-3xl">🎁</p>
            </div>
            <h3 className="text-xl font-serif font-bold mb-3 text-foreground">Bao bì cao cấp</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Đóng gói chuẩn quà tặng, tinh tế và sang trọng, sẵn sàng trao tay người thương.</p>
          </div>
          <div className="group rounded-3xl bg-card p-10 text-center shadow-sm border border-border/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
            <div className="mx-auto size-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
              <p className="text-3xl">🚚</p>
            </div>
            <h3 className="text-xl font-serif font-bold mb-3 text-foreground">Giao hàng toàn quốc</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Nhận hàng nhanh chóng từ 2-4 ngày làm việc, đảm bảo nguyên vẹn sản phẩm.</p>
          </div>
          <div className="group rounded-3xl bg-card p-10 text-center shadow-sm border border-border/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
            <div className="mx-auto size-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
              <p className="text-3xl">🌿</p>
            </div>
            <h3 className="text-xl font-serif font-bold mb-3 text-foreground">Chất lượng tuyển chọn</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Sản phẩm chính gốc, cam kết hoàn tiền 100% nếu không đúng chất lượng mô tả.</p>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-secondary uppercase mb-3">Mới nhất</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Vừa lên kệ</h2>
        </div>
        {newProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {newProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                showStory={false}
                showCategory={true}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">Chưa có sản phẩm mới.</p>
        )}
      </section>
    </div>
  );
}
