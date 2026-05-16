"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LiquidGlassPanel from "@/components/ui/LiquidGlassPanel";
import { LOGIN_IMAGES } from "@/lib/mock-data";
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
const strengthColors = ["#E5E7EB", "#D94F45", "#C78222", "#2F5D50", "#1B8A62"];

const fieldClass =
  "h-12 rounded-xl border-border/80 bg-background/80 px-4 text-[15px] text-foreground shadow-sm backdrop-blur transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-white/8 dark:focus-visible:ring-primary/30";

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
  const [bg, setBg] = useState(LOGIN_IMAGES[0]);

  useEffect(() => {
    setBg(LOGIN_IMAGES[Math.floor(Math.random() * LOGIN_IMAGES.length)]);
  }, []);

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
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground">
      <Image src={bg} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(250,247,239,0.92),rgba(255,255,255,0.74),rgba(47,93,80,0.45))] backdrop-blur-[2px] dark:bg-[linear-gradient(120deg,rgba(8,25,22,0.92),rgba(18,22,25,0.82),rgba(47,93,80,0.54))]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="relative z-10 max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-3xl border border-border/70 bg-card/80 shadow-[0_24px_70px_rgba(24,38,34,0.18)] backdrop-blur-xl dark:shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
      >
        <LiquidGlassPanel variant="modal" className="h-full w-full rounded-3xl">
          <div className="relative p-7 sm:p-9">
            <div className="mb-6 text-center">
              <Link href="/" className="mb-4 inline-flex items-center gap-3">
                <Image src="/logo.png" alt="Logo" width={44} height={44} className="object-contain" />
                <span className="text-base font-bold text-foreground">Shop Lưu Niệm</span>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Tạo tài khoản
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Lưu thông tin mua hàng và theo dõi đơn dễ hơn.
              </p>
            </div>

            <button
              type="button"
              onClick={googleSignup}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/85 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-background active:scale-[0.99]"
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                hoặc
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input {...form.register("name")} placeholder="Nguyễn Văn A" autoComplete="name" className={fieldClass} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...form.register("email")} type="email" placeholder="you@example.com" autoComplete="email" className={fieldClass} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Số điện thoại <span className="font-normal text-muted-foreground">(tùy chọn)</span>
                </Label>
                <Input {...form.register("phone")} type="tel" placeholder="0912 345 678" autoComplete="tel" className={fieldClass} />
              </div>

              <div className="space-y-1.5">
                <Label>Mật khẩu</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    {...form.register("password")}
                    placeholder="Tối thiểu 8 ký tự"
                    autoComplete="new-password"
                    className={`${fieldClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((value) => !value)}
                    className="absolute right-3 top-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                    style={{ transform: "translateY(-50%)" }}
                    tabIndex={-1}
                    aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className="h-1 flex-1 rounded-full transition"
                          style={{ backgroundColor: strength >= index ? strengthColors[strength] : "#E5E7EB" }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
                {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    {...form.register("confirmPassword")}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    className={`${fieldClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    className="absolute right-3 top-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                    style={{ transform: "translateY(-50%)" }}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox
                  id="accepted"
                  checked={Boolean(form.watch("accepted"))}
                  onCheckedChange={(checked) => form.setValue("accepted", Boolean(checked))}
                  className="mt-0.5"
                />
                <label htmlFor="accepted" className="cursor-pointer text-sm leading-snug text-muted-foreground">
                  Tôi đồng ý với{" "}
                  <a href="#" className="font-semibold text-primary hover:underline">
                    Điều khoản
                  </a>{" "}
                  và{" "}
                  <a href="#" className="font-semibold text-primary hover:underline">
                    Chính sách bảo mật
                  </a>
                </label>
              </div>
              {form.formState.errors.accepted && <p className="text-xs text-destructive">{form.formState.errors.accepted.message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  "Tạo tài khoản"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </LiquidGlassPanel>
      </motion.section>
    </main>
  );
}
