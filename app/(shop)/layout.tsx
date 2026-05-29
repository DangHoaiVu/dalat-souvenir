import Footer from "@/components/shop/Footer";
import Header from "@/components/shop/Header";
import CustomerAreaGuard from "@/components/auth/CustomerAreaGuard";
import CartDrawerMount from "@/components/shop/CartDrawerMount";
import AIChatWidget from "@/components/shop/AIChatWidget";

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CustomerAreaGuard>
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <Header />
        <main id="main-content" className="pt-16 lg:pt-20">{children}</main>
        <Footer />
        <CartDrawerMount />
        <AIChatWidget />
      </div>
    </CustomerAreaGuard>
  );
}
