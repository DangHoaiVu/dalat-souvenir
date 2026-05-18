"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputField } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";

const schema = z
  .object({
    name: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().optional(),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu"),
    accepted: z.boolean().refine((value) => value, "Bạn cần đồng ý điều khoản"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof schema>;

const strengthLabels = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
const strengthClasses = ["bg-surface-hover", "bg-error", "bg-warning", "bg-accent", "bg-success"];

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function Page() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      accepted: false,
    },
  });

  const password = form.watch("password");
  const strength = useMemo(() => getStrength(password || ""), [password]);

  const googleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) toast.error(error.message);
  };

  const onSubmit = async (values: RegisterValues) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { name: values.name, phone: values.phone } },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const user = data.user;
      if (!user) {
        toast.error("Đăng ký thành công nhưng không thể tự động đăng nhập");
        router.push("/login");
        return;
      }

      login({
        id: user.id,
        name: user.user_metadata?.name || values.name,
        email: user.email || "",
        phone: user.user_metadata?.phone || values.phone || "",
        points: 0,
        role: "customer",
      });

      toast.success("Tạo tài khoản thành công");
      router.push("/");
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background-soft px-4 py-8 text-primary">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-border-hover) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-xl border border-[--color-border] bg-surface p-8 shadow-lg"
      >
        <div className="mb-6 text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={44} height={44} className="object-contain" />
            <span className="text-base font-bold text-accent">Đà Lạt Souvenir</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Tạo tài khoản</h1>
          <p className="mt-2 text-sm text-secondary">Lưu thông tin mua hàng và theo dõi đơn dễ hơn.</p>
        </div>

        <button
          type="button"
          onClick={googleSignup}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[--color-border] bg-surface text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:border-[--color-border-hover] hover:bg-surface-muted"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09a6.97 6.97 0 0 1 0-4.18V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Đăng ký bằng Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">hoặc</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <InputField label="Họ và tên" placeholder="Nguyễn Văn A" autoComplete="name" errorMessage={form.formState.errors.name?.message} {...form.register("name")} />
          <InputField label="Email" type="email" placeholder="you@example.com" autoComplete="email" errorMessage={form.formState.errors.email?.message} {...form.register("email")} />
          <InputField label="Số điện thoại" type="tel" placeholder="0912 345 678" autoComplete="tel" hint="Tùy chọn" {...form.register("phone")} />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Mật khẩu</label>
            <div className="relative">
              <InputField
                type={showPw ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
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
            {password && (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition ${strength >= index ? strengthClasses[strength] : "bg-surface-hover"}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-secondary">{strengthLabels[strength]}</span>
              </div>
            )}
          </div>

          <div className="relative">
            <InputField
              label="Xác nhận mật khẩu"
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              errorMessage={form.formState.errors.confirmPassword?.message}
              className="pr-11"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-3 top-8 rounded-md p-1 text-tertiary transition hover:text-primary"
              tabIndex={-1}
              aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="accepted"
              checked={Boolean(form.watch("accepted"))}
              onCheckedChange={(checked) => form.setValue("accepted", Boolean(checked))}
              className="mt-0.5"
            />
            <label htmlFor="accepted" className="cursor-pointer text-sm leading-snug text-secondary">
              Tôi đồng ý với{" "}
              <a href="#" className="font-semibold text-accent hover:underline">Điều khoản</a>{" "}
              và{" "}
              <a href="#" className="font-semibold text-accent hover:underline">Chính sách bảo mật</a>
            </label>
          </div>
          {form.formState.errors.accepted && <p className="text-xs text-error">{form.formState.errors.accepted.message}</p>}

          <Button type="submit" size="lg" isLoading={loading} className="w-full">
            Tạo tài khoản
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold text-accent hover:underline">
            Đăng nhập
          </Link>
        </p>
      </motion.section>
    </main>
  );
}
