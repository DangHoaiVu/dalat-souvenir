"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import LiquidGlassPanel from "@/components/ui/LiquidGlassPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";
import { LOGIN_IMAGES } from "@/lib/mock-data";

const schema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  confirmPassword: z.string().min(1, "Xác nhận mật khẩu"),
  accepted: z.boolean().refine(v => v, "Bạn cần đồng ý điều khoản"),
}).refine(v => v.password === v.confirmPassword, { message: "Mật khẩu không khớp", path: ["confirmPassword"] });

type RegisterValues = z.infer<typeof schema>;

function getStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STR_LABELS = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
const STR_COLORS = ["#E5E7EB", "#EF4444", "#F59E0B", "#52B788", "#10B981"];

export default function Page() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [bg, setBg] = useState(LOGIN_IMAGES[0]);

  useEffect(() => { setBg(LOGIN_IMAGES[Math.floor(Math.random() * LOGIN_IMAGES.length)]); }, []);

  const form = useForm<RegisterValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", accepted: false } });

  const pw = form.watch("password");
  const strength = useMemo(() => getStrength(pw || ""), [pw]);

  const googleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) toast.error(error.message);
  };

  const onSubmit = async (v: RegisterValues) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email: v.email, password: v.password, options: { data: { name: v.name, phone: v.phone } } });
      if (error) { toast.error(error.message); return; }
      const user = data.user;
      if (!user) { toast.error("Đăng ký thành công nhưng không thể tự động đăng nhập"); router.push("/login"); return; }
      login({ id: user.id, name: user.user_metadata?.name || v.name, email: user.email || "", phone: user.user_metadata?.phone || v.phone || "", points: 0, role: "customer" });
      toast.success("Tạo tài khoản thành công!");
      router.push("/");
    } catch { toast.error("Có lỗi xảy ra"); } finally { setLoading(false); }
  };

  const inputCls = "h-12 rounded-2xl border-[#D0D5DD] bg-white/75 px-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] shadow-sm backdrop-blur-sm transition-all focus-visible:border-[#2F5D50] focus-visible:ring-2 focus-visible:ring-[#2F5D50]/25 dark:border-white/12 dark:bg-white/8 dark:text-white dark:placeholder:text-white/30 dark:focus-visible:border-[#2F5D50] dark:focus-visible:ring-[#2F5D50]/40";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F3EB] px-4 py-8 dark:bg-[#0F1115]">

      {/* ── Background Image ── */}
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />

      {/* ── Overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7F3EB]/70 via-white/45 to-[#2F5D50]/30 backdrop-blur-[2px] dark:from-[#0F1115]/80 dark:via-[#111827]/65 dark:to-[#2F5D50]/40" />

      {/* ── Light Blobs ── */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#2F5D50]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#C94C4C]/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2F5D50]/10 blur-[100px]" />

      {/* ── Register Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-[32px] border border-white/50 shadow-[0_24px_80px_rgba(15,17,21,0.18)] ring-1 ring-white/40 scrollbar-hide dark:border-white/15 dark:ring-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <LiquidGlassPanel variant="modal" className="h-full w-full rounded-[32px]">
          {/* Glass Highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/45 via-white/10 to-transparent dark:from-white/10 dark:via-white/3 dark:to-transparent" />

          <div className="relative z-10 p-8 sm:p-10">

            {/* Logo + Brand */}
            <div className="mb-6 flex flex-col items-center text-center">
              <Link href="/" className="mb-4 inline-flex items-center gap-2.5">
                <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain drop-shadow-md" />
                <span className="text-lg font-bold tracking-tight text-[#111827] dark:text-[#F3F4F6]">Shop Lưu Niệm</span>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-[#F3F4F6] sm:text-4xl">Tạo tài khoản</h1>
              <p className="mt-2 text-sm text-[#667085] dark:text-[#9CA3AF]">Tham gia cùng hàng ngàn khách hàng</p>
            </div>

            {/* Google */}
            <button type="button" onClick={googleSignup} className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#D0D5DD] bg-white/75 text-[14px] font-medium text-[#374151] shadow-sm backdrop-blur-sm transition-all hover:bg-white/90 hover:shadow-md active:scale-[0.98] dark:border-white/12 dark:bg-white/8 dark:text-[#E5E7EB] dark:hover:bg-white/12">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09a6.97 6.97 0 010-4.18V7.07H2.18A11 11 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Đăng ký bằng Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#D0D5DD]/60 dark:bg-white/10" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">hoặc</span>
              <div className="h-px flex-1 bg-[#D0D5DD]/60 dark:bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1F2933] dark:text-[#E5E7EB]">Họ và tên</Label>
                <Input {...form.register("name")} placeholder="Nguyễn Văn A" autoComplete="name" className={inputCls} />
                {form.formState.errors.name && <p className="text-xs text-red-500" role="alert">⚠ {form.formState.errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1F2933] dark:text-[#E5E7EB]">Email</Label>
                <Input {...form.register("email")} type="email" placeholder="you@example.com" autoComplete="email" className={inputCls} />
                {form.formState.errors.email && <p className="text-xs text-red-500" role="alert">⚠ {form.formState.errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1F2933] dark:text-[#E5E7EB]">Số điện thoại <span className="font-normal text-[#9CA3AF]">(tuỳ chọn)</span></Label>
                <Input {...form.register("phone")} type="tel" placeholder="0912 345 678" autoComplete="tel" className={inputCls} />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1F2933] dark:text-[#E5E7EB]">Mật khẩu</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} {...form.register("password")} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors" tabIndex={-1}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pw && pw.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: strength >= i ? STR_COLORS[strength] : "#E5E7EB" }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: STR_COLORS[strength] }}>{STR_LABELS[strength]}</span>
                  </div>
                )}
                {form.formState.errors.password && <p className="text-xs text-red-500" role="alert">⚠ {form.formState.errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1F2933] dark:text-[#E5E7EB]">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input type={showCf ? "text" : "password"} {...form.register("confirmPassword")} placeholder="Nhập lại mật khẩu" autoComplete="new-password" className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowCf(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white transition-colors" tabIndex={-1}>
                    {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && <p className="text-xs text-red-500" role="alert">⚠ {form.formState.errors.confirmPassword.message}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox id="accepted" checked={Boolean(form.watch("accepted"))} onCheckedChange={c => form.setValue("accepted", Boolean(c))} className="mt-0.5 h-4 w-4 rounded-[5px] border-[#D0D5DD] data-[state=checked]:bg-[#2F5D50] data-[state=checked]:border-[#2F5D50] dark:border-white/20" />
                <label htmlFor="accepted" className="cursor-pointer select-none text-sm leading-snug text-[#4B5563] dark:text-[#9CA3AF]">
                  Tôi đồng ý với{" "}
                  <a href="#" className="font-semibold text-[#2F5D50] hover:underline dark:text-[#52B788]">Điều khoản</a>
                  {" "}và{" "}
                  <a href="#" className="font-semibold text-[#2F5D50] hover:underline dark:text-[#52B788]">Chính sách bảo mật</a>
                </label>
              </div>
              {form.formState.errors.accepted && <p className="text-xs text-red-500 -mt-1" role="alert">⚠ {form.formState.errors.accepted.message}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2F5D50] text-[15px] font-semibold text-white shadow-lg shadow-[#2F5D50]/25 transition-all hover:-translate-y-0.5 hover:bg-[#23483E] hover:shadow-xl hover:shadow-[#2F5D50]/30 active:translate-y-0 active:shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  "Tạo tài khoản"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold text-[#2F5D50] hover:underline dark:text-[#52B788]">
                Đăng nhập
              </Link>
            </p>
          </div>
        </LiquidGlassPanel>
      </motion.div>
    </div>
  );
}
