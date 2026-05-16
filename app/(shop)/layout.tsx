import Footer from "@/components/shop/Footer";
import Header from "@/components/shop/Header";
import CustomerAreaGuard from "@/components/auth/CustomerAreaGuard";
import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/components/shop/CartDrawer"), {
  ssr: false,
});

const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CustomerAreaGuard>
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <CartDrawer />
        <Toaster richColors />
      </div>
    </CustomerAreaGuard>
  );
}
