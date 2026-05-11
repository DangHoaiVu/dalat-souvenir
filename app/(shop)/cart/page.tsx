import CartPageClient from "@/components/shop/CartPageClient";

export default function Page() {
  // Recommendations removed at user request. 
  // We only show real history now, which is fetched client-side if logged in.
  return <CartPageClient initialRecommendations={[]} />;
}

