"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputField } from "@/components/ui/input";
import { AuthBackgroundDecor, AuthCardMascot } from "@/components/auth/AuthDecor";
import { supabase } from "@/lib/supabaseClient";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof schema>;

export default function Page() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message || "Đăng nhập thất bại");
        return;
      }

      toast.success("Đăng nhập thành công");
      const params = new URLSearchParams(window.location.search);
      const requestedPath = params.get("redirect") ?? params.get("callbackUrl");
      const callback =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : null;

      router.push(callback ?? "/");
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    const params = new URLSearchParams(window.location.search);
    const requestedPath = params.get("redirect") ?? params.get("callbackUrl");
    const callback =
      requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callback)}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) toast.error(error.message);
  };

  const forgotPw = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast.error("Nhập email trước");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) toast.error(error.message);
    else toast.success("Đã gửi email đặt lại mật khẩu");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-soft px-3 py-6 text-primary sm:px-4 sm:py-10">
      <AuthBackgroundDecor />

      <div className="relative z-10 w-full max-w-[440px]">
        <AuthCardMascot />
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full rounded-xl border border-[--color-border] bg-surface/95 p-5 shadow-xl shadow-sky-950/10 backdrop-blur sm:p-8"
      >
        <div className="mb-7 text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={44} height={44} className="object-contain" />
            <span className="text-base font-bold text-accent">Đà Lạt Souvenir</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">Đăng nhập</h1>
          <p className="mt-2 text-sm text-secondary">Tiếp tục mua sắm và quản lý đơn hàng của bạn.</p>
        </div>

        <button
          type="button"
          onClick={googleLogin}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[--color-border] bg-surface text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:border-[--color-border-hover] hover:bg-surface-muted"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09a6.97 6.97 0 0 1 0-4.18V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Đăng nhập với Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">hoặc</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <InputField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder=""
            errorMessage={form.formState.errors.email?.message}
            {...form.register("email")}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-primary">Mật khẩu</label>
              <button type="button" onClick={forgotPw} className="text-xs font-semibold text-accent hover:underline">
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <InputField
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                errorMessage={form.formState.errors.password?.message}
                className="pr-11"
                wrapperClassName="space-y-1.5"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((value) => !value)}
                className="absolute right-3 top-5 rounded-md p-1 text-tertiary transition hover:text-primary"
                tabIndex={-1}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Checkbox
              id="remember"
              checked={Boolean(form.watch("remember"))}
              onCheckedChange={(checked) => form.setValue("remember", Boolean(checked))}
            />
            <label htmlFor="remember" className="cursor-pointer text-sm text-secondary">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <Button type="submit" size="lg" isLoading={loading} className="w-full">
            Đăng nhập
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-secondary">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-accent hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </motion.section>
      </div>
    </main>
  );
}
