import SimpleHeader from "@/components/shop/SimpleHeader";
import CustomerAccountGuard from "@/components/auth/CustomerAccountGuard";
import AccountNav from "@/components/account/AccountNav";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerAccountGuard>
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <SimpleHeader />
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex min-w-0 items-start gap-5 lg:gap-8">
            <AccountNav mode="desktop" />
            <main className="min-w-0 flex-1">
              <AccountNav mode="mobile" />
              {children}
            </main>
          </div>
        </div>
      </div>
    </CustomerAccountGuard>
  );
}
