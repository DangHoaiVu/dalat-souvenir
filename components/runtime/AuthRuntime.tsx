"use client";

import { useEffect, useRef } from "react";

import { isAdminEmail } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

export default function AuthRuntime() {
  return (
    <>
      <AuthListener />
      <CartAuthSync />
    </>
  );
}

function CartAuthSync() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const userId = useAuthStore((state) => state.user?.id);
  const setCartOwner = useCartStore((state) => state.setOwner);

  useEffect(() => {
    setCartOwner(isInitialized && isLoggedIn && userId ? String(userId) : null);
  }, [isInitialized, isLoggedIn, setCartOwner, userId]);

  return null;
}

function AuthListener() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const authRequestIdRef = useRef(0);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const requestId = ++authRequestIdRef.current;

      if (!session?.user) {
        logout();
        return;
      }

      const baseRole = isAdminEmail(session.user.email) ? "admin" : "customer";

      login({
        id: session.user.id,
        name: session.user.user_metadata?.name || (session.user.email ?? ""),
        email: session.user.email ?? "",
        phone: session.user.user_metadata?.phone || "",
        points: 0,
        role: baseRole,
      });

      void (async () => {
        try {
          let { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone_number")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!profile && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
            const { error } = await supabase
              .from("profiles")
              .upsert(
                {
                  user_id: session.user.id,
                  full_name: session.user.user_metadata?.name || (session.user.email ?? ""),
                  phone_number: session.user.user_metadata?.phone || "",
                },
                { onConflict: "user_id" },
              );

            if (!error) {
              const res = await supabase
                .from("profiles")
                .select("full_name, phone_number")
                .eq("user_id", session.user.id)
                .maybeSingle();
              profile = res.data;
            }
          }

          let isSeller = false;
          try {
            const { data } = await supabase.rpc("is_seller");
            isSeller = Boolean(data);
          } catch {
            isSeller = false;
          }

          if (authRequestIdRef.current !== requestId) {
            return;
          }

          updateUser({
            id: session.user.id,
            name: profile?.full_name || session.user.user_metadata?.name || (session.user.email ?? ""),
            email: session.user.email ?? "",
            phone: profile?.phone_number || session.user.user_metadata?.phone || "",
            points: 0,
            role: isSeller ? "seller" : baseRole,
          });
        } catch {
          // Keep optimistic user data if enrichment fails.
        }
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [login, logout, updateUser]);

  return null;
}
