import SimpleHeader from "@/components/shop/SimpleHeader";
import CustomerAccountGuard from "@/components/auth/CustomerAccountGuard";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerAccountGuard>
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <SimpleHeader />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <main>{children}</main>
        </div>
      </div>
    </CustomerAccountGuard>
  );
}
