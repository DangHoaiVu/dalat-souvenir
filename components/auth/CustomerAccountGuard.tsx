"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/authStore";

export default function CustomerAccountGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isLoggedIn) {
      router.replace("/login?callbackUrl=/account/profile");
      return;
    }

    setIsAllowed(true);
  }, [isInitialized, isLoggedIn, router]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
