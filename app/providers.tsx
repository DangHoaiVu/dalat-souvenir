"use client";

import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";
import NextTopLoader from "nextjs-toploader";

const AuthRuntime = dynamic(() => import("@/components/runtime/AuthRuntime"), {
  ssr: false,
});

const Toaster = dynamic(() => import("@/components/ui/sonner").then((mod) => mod.Toaster), {
  ssr: false,
});

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <NextTopLoader
        color="var(--color-accent)"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
      <Toaster />
      <AuthRuntime />
      {children}
    </ThemeProvider>
  );
}
