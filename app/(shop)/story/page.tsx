import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  Globe, Heart, ShieldCheck, Zap, ArrowDown, 
  Video, Facebook, Youtube, MessageCircle, Instagram, 
} from "lucide-react";

export const metadata: Metadata = {
  title: "Câu Chuyện Của Chúng Tôi | Shop Lưu Niệm Đà Lạt",
  description: "Shop Lưu Niệm Đà Lạt - Những món quà nhỏ giữ lại ký ức thành phố sương mù.",
};

export const dynamic = "force-static";

export default function StoryPage() {
  return (
    <div className="relative min-h-screen text-white selection:bg-lime-400/30 font-sans">
      {/* 1. FIXED PARALLAX BACKGROUND */}
      <div className="fixed inset-0 z-0 h-full w-full pointer-events-none">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <Image
          src="/story-bg.jpeg"
          alt="Dalat Landscapes"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* 2. MAIN CONTENT SCROLL FLOW */}
      <main className="relative z-10 flex flex-col items-center bg-transparent">
        
        {/* HERO SECTION */}
        <section className="flex min-h-screen w-full flex-col items-center justify-center px-4 text-center">
          <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <Image
              src="/logo.png"
              alt="Shop Lưu Niệm Đà Lạt Logo"
              width={512}
              height={192}
              priority
              className="mx-auto w-64 sm:w-80 md:w-[32rem] h-auto drop-shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-50 duration-1000 delay-300"
            />
            <h1 className="text-6xl font-black tracking-tighter sm:text-8xl md:text-9xl leading-[0.85] drop-shadow-2xl">
              Từ Chuyến Đi<br />Đến Món Quà
            </h1>
            <p className="mx-auto max-w-2xl text-xl font-medium tracking-wide text-white/80 sm:text-2xl drop-shadow-md">
              Giữ lại một góc Đà Lạt sau mỗi hành trình.
            </p>
          </div>

          <div className="absolute bottom-12 animate-bounce flex flex-col items-center gap-3 opacity-40">
            <ArrowDown className="size-6" />
          </div>
        </section>

        {/* CHAPTERS: ORIGIN & MISSION */}
        <div className="w-full max-w-4xl px-6 space-y-64 pb-64">
          
          {/* 01. Khởi Nguyên */}
          <article className="space-y-10 group">
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.4em] text-lime-400">01. Khởi Nguyên</p>
              <h2 className="text-5xl font-extrabold md:text-7xl tracking-tighter leading-none group-hover:text-lime-400 transition-colors duration-500">
                Những góc phố nhỏ trong làn sương.
              </h2>
            </div>
            <div className="space-y-8 text-xl md:text-2xl text-white/80 leading-relaxed font-normal">
              <p>
                Shop Lưu Niệm Đà Lạt khởi đầu từ mong muốn gom lại những ký ức rất nhỏ của một chuyến đi: một tấm postcard, chiếc móc khóa, chiếc túi vải hay món đồ len ấm tay.
                Chúng tôi chọn cảm hứng từ <span className="text-white font-bold italic"> Hồ Xuân Hương, ga Đà Lạt, Langbiang và những mùa hoa</span>.
              </p>
              <p>
                Mỗi sản phẩm được chọn để dễ làm quà, dễ mang theo và đủ gợi nhớ về nhịp sống dịu dàng của thành phố sương mù.
              </p>
            </div>
          </article>

          {/* 02. Sứ Mệnh */}
          <article className="space-y-10 text-right group">
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.4em] text-lime-400">02. Sứ Mệnh</p>
              <h2 className="text-5xl font-extrabold md:text-7xl tracking-tighter leading-none group-hover:text-lime-400 transition-colors duration-500">
                Kết nối ký ức và quà tặng.
              </h2>
            </div>
            <div className="space-y-8 text-xl md:text-2xl text-white/80 leading-relaxed ml-auto max-w-2xl">
              <p>
                Shop Lưu Niệm Đà Lạt muốn trở thành nơi du khách tìm thấy món quà phù hợp cho bạn bè, gia đình và chính mình sau mỗi lần ghé Đà Lạt.
              </p>
              <p>
                Từ chiếc móc khóa nhỏ cho người bạn ở Sài Gòn đến hộp quà lưu niệm gửi xa, mỗi món đều mang theo một chút không khí Đà Lạt.
              </p>
            </div>
          </article>

          {/* 03. CHIẾN LƯỢC TIẾP CẬN (NEW CONTENT) */}
          <article className="space-y-12">
            <div className="space-y-3 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.4em] text-lime-400">03. Chiến Lược Tiếp Cận</p>
              <h2 className="text-5xl font-extrabold md:text-7xl tracking-tighter leading-none">
                Kể chuyện bằng nội dung số.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
                Chúng tôi không chỉ bán hàng — chúng tôi kể câu chuyện về hành trình, ký ức du lịch và vẻ đẹp Đà Lạt qua từng khung hình.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-6">
              {[
                { name: "TikTok", icon: Video, role: "Viral & Thế hệ Z" },
                { name: "Facebook", icon: Facebook, role: "Cộng đồng & Quảng cáo" },
                { name: "YouTube", icon: Youtube, role: "Câu chuyện chuyên sâu" },
                { name: "Zalo OA", icon: MessageCircle, role: "Chăm sóc khách hàng" },
                { name: "Instagram", icon: Instagram, role: "Thẩm mỹ quốc tế" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-4 p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-black/60">
                  <div className="size-12 rounded-2xl bg-lime-400/20 flex items-center justify-center text-lime-400">
                    <p.icon className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">{p.name}</h4>
                    <p className="text-xs text-white/50">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* 04. LỘ TRÌNH TRIỂN KHAI (NEW CONTENT) */}
          <article className="space-y-12">
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.4em] text-lime-400">04. Lộ Trình 2026</p>
              <h2 className="text-5xl font-extrabold md:text-7xl tracking-tighter leading-none">
                Hành trình 6 tháng bứt phá.
              </h2>
            </div>
            
            <div className="space-y-4 pt-10">
              {/* Step 1 */}
              <div className="relative pl-12 pb-12 border-l border-white/10 group">
                <div className="absolute left-0 top-0 -translate-x-1/2 size-4 rounded-full bg-lime-400 border-4 border-black group-hover:scale-150 transition-transform" />
                <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
                  <h4 className="text-lime-400 font-bold mb-2">Tháng 1 – 2: Xây dựng uy tín số</h4>
                  <p className="text-white/70">Tập trung SEO blog, kênh TikTok & Facebook với 20 video đầu tiên. Mục tiêu 1.000 Facebook followers.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="relative pl-12 pb-12 border-l border-white/10 group">
                <div className="absolute left-0 top-0 -translate-x-1/2 size-4 rounded-full bg-white/40 border-4 border-black group-hover:bg-lime-400 transition-colors" />
                <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
                  <h4 className="text-lime-400 font-bold mb-2">Tháng 3 – 4: Bùng nổ giao dịch</h4>
                  <p className="text-white/70">Triển khai Referral Program, KOC review và TikTok Shop. Mục tiêu tăng +30% doanh thu mỗi tháng.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="relative pl-12 border-l border-white/10 group">
                <div className="absolute left-0 top-0 -translate-x-1/2 size-4 rounded-full bg-white/40 border-4 border-black group-hover:bg-lime-400 transition-colors" />
                <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
                  <h4 className="text-lime-400 font-bold mb-2">Tháng 5 – 6: Vươn tầm quốc tế</h4>
                  <p className="text-white/70">Chiến dịch &ldquo;Gửi quà xuyên lục địa&rdquo;, nội dung song ngữ và B2B LinkedIn UK. Mục tiêu 50 đơn quốc tế/tháng.</p>
                </div>
              </div>
            </div>
          </article>

        </div>

        {/* CORE VALUES & KPI SECTION - Removed the "black wall" to show the forest background */}
        <section className="w-full py-32 border-y border-white/5 relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-24 text-center space-y-4">
              <p className="text-xl font-bold uppercase tracking-[0.4em] text-lime-400">KPI mục tiêu — 6 tháng đầu</p>
            </div>

            {/* KPI STATS - Glass style cards */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-32 text-center">
              <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 space-y-2 group hover:bg-black/60 transition-colors">
                <p className="text-4xl font-black text-lime-400 transition-transform group-hover:scale-110">10.000</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] leading-none">Facebook Follows</p>
              </div>
              <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 space-y-2 group hover:bg-black/60 transition-colors">
                <p className="text-4xl font-black text-lime-400 transition-transform group-hover:scale-110">100K+</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] leading-none">TikTok Views</p>
              </div>
              <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 space-y-2 group hover:bg-black/60 transition-colors">
                <p className="text-4xl font-black text-lime-400 transition-transform group-hover:scale-110">30%</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] leading-none">Social Revenue</p>
              </div>
              <div className="p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 space-y-2 group hover:bg-black/60 transition-colors">
                <p className="text-4xl font-black text-lime-400 transition-transform group-hover:scale-110">50+</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] leading-none">Int. Orders / Mo</p>
              </div>
            </div>

            <div className="mb-24 text-center space-y-4">
              <p className="text-xl font-bold uppercase tracking-[0.4em] text-lime-400">Giá Trị Cốt Lõi</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Chất", icon: ShieldCheck, desc: "Sản phẩm được chọn kỹ, dễ làm quà và có tinh thần Đà Lạt rõ ràng." },
                { title: "Tốc", icon: Zap, desc: "Tối ưu tốc độ giỏ hàng và cập nhật ETA chính xác theo thời gian thực." },
                { title: "Tín", icon: Globe, desc: "Minh bạch trong mọi chính sách và bảo mật thông tin tuyệt đối." },
                { title: "Tâm", icon: Heart, desc: "Đồng hành cùng cộng đồng từ Tết Nguyên Đán đến mùa Giáng Sinh." },
              ].map((v) => (
                <div key={v.title} className="group p-10 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-500 hover:bg-lime-400/20">
                  <v.icon className="size-12 text-lime-400 mb-8" />
                  <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">{v.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-medium">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="w-full py-64 text-center flex flex-col items-center px-6">
          <div className="space-y-12 max-w-4xl">
            <h2 className="text-3xl font-bold sm:text-5xl md:text-7xl tracking-tighter uppercase">
              Gói Trọn Đà Lạt.
            </h2>
            <div className="pt-8">
              <Link 
                href="/products" 
                className="inline-flex h-20 items-center justify-center rounded-full bg-lime-400 px-16 text-xl font-black uppercase tracking-widest text-white transition-all hover:scale-105 shadow-[0_0_50px_rgba(var(--primary),0.3)]"
              >
                Trải Nghiệm Ngay
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
