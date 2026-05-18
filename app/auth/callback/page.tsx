"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function CallbackLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background-soft px-4 text-primary">
      <section className="w-full max-w-md rounded-xl border border-[--color-border] bg-surface p-8 text-center shadow-lg">
        <Loader2 className="mx-auto mb-4 size-11 animate-spin text-accent" />
        <h1 className="text-2xl font-bold">Dang xu ly dang nhap</h1>
        <p className="mt-3 text-sm text-secondary">Vui long doi trong giay lat.</p>
      </section>
    </main>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const nextPath = useMemo(() => getSafeNext(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    let isMounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function finishSignIn() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (!data.session?.user) {
        setError("Khong nhan duoc phien dang nhap Google. Vui long thu lai.");
        return;
      }

      setReady(true);
      redirectTimer = setTimeout(() => {
        router.replace(nextPath);
      }, 450);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        setReady(true);
        redirectTimer = setTimeout(() => {
          router.replace(nextPath);
        }, 300);
      }
    });

    const timer = setTimeout(() => {
      void finishSignIn();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (redirectTimer) clearTimeout(redirectTimer);
      subscription.unsubscribe();
    };
  }, [nextPath, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-soft px-4 text-primary">
      <section className="w-full max-w-md rounded-xl border border-[--color-border] bg-surface p-8 text-center shadow-lg">
        {error ? (
          <>
            <XCircle className="mx-auto mb-4 size-11 text-error" />
            <h1 className="text-2xl font-bold">Dang nhap Google that bai</h1>
            <p className="mt-3 text-sm leading-6 text-secondary">{error}</p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent-hover"
            >
              Quay lai dang nhap
            </Link>
          </>
        ) : ready ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 size-11 text-success" />
            <h1 className="text-2xl font-bold">Dang nhap thanh cong</h1>
            <p className="mt-3 text-sm text-secondary">Dang chuyen ban ve website...</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 size-11 animate-spin text-accent" />
            <h1 className="text-2xl font-bold">Dang xu ly dang nhap</h1>
            <p className="mt-3 text-sm text-secondary">Vui long doi trong giay lat.</p>
          </>
        )}
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
