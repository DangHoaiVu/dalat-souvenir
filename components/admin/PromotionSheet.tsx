"use client";

import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  ImagePlus, 
  Info,
  Calendar,
  CircleDollarSign,
  Zap,
  X,
  Loader2,
  Check,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { uploadAdminImage } from "@/lib/admin-image-upload";
import { authFetch } from "@/lib/auth-fetch";
import { cn } from "@/lib/utils";
import type { Promotion } from "@/types";

interface PromotionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion | null;
  onSave: (payload: Promotion) => void;
}

export default function PromotionSheet({
  open,
  onOpenChange,
  promotion,
  onSave,
}: PromotionSheetProps) {
  const uploading = false;
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    fixed_price: "",
    description: "",
    image: "",
    is_active: true,
  });

  useEffect(() => {
    if (!promotion) {
      const today = new Date().toISOString().split('T')[0];
      setForm({
        name: "",
        start_date: today,
        end_date: "",
        fixed_price: "",
        description: "",
        image: "",
        is_active: true,
      });
      setShowUrlInput(false);
      setSelectedFile(null);
      return;
    }

    setForm({
      name: promotion.name,
      start_date: promotion.start_date.split('T')[0],
      end_date: promotion.end_date.split('T')[0],
      fixed_price: String(promotion.fixed_price ?? ""),
      description: promotion.description || "",
      image: promotion.image || "",
      is_active: promotion.is_active,
    });

    setSelectedFile(null);
    if (promotion.image && !promotion.image.includes('supabase')) {
      setShowUrlInput(true);
    }
  }, [promotion, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setForm((f) => ({ ...f, image: previewUrl }));
    setShowUrlInput(false);
    setSaveError("");
  };

  const compressImage = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  const save = async () => {
    setSaveError("");
    setSaveStatus("");
    setIsSaving(true);
    
    let finalImageUrl = form.image;

    if (selectedFile) {
      try {
        setSaveStatus("Đang tối ưu ảnh...");
        const compressedBlob = await compressImage(selectedFile);
        
        setSaveStatus("Đang tải ảnh lên...");
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `promo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        finalImageUrl = await uploadAdminImage(compressedBlob, "promotion", fileName);
      } catch {
        setSaveError('Đã xảy ra lỗi khi xử lý ảnh.');
        setIsSaving(false);
        setSaveStatus("");
        return;
      }
    }

    setSaveStatus("Đang lưu...");
    
    const startDate = new Date(form.start_date);

    const payload = {
      ...(promotion?.promotion_id ? { promotion_id: promotion.promotion_id } : {}),
      name: form.name,
      start_date: startDate.toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      fixed_price: form.fixed_price ? Number(form.fixed_price) : null,
      description: form.description || null,
      image: finalImageUrl || null,
      is_active: form.is_active,
    };
    
    try {
      const res = await authFetch("/api/promotions", {
        method: promotion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      if (result.error) {
        setSaveError(result.error);
        setSaveStatus("");
        return;
      }
      onSave(result);
      onOpenChange(false);
    } catch {
      setSaveError("Lỗi khi lưu khuyến mãi. Vui lòng thử lại.");
      setSaveStatus("");
    } finally {
      setIsSaving(false);
    }
  };

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  const handleAIDescription = async () => {
    if (!form.name) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "promotion",
          promotionName: form.name,
        }),
      });
      const data = await res.json();
      if (data.description) {
        setForm((f) => ({ ...f, description: data.description }));
      } else {
        setAiError("Không tạo được mô tả. Hãy thử lại.");
      }
    } catch {
      setAiError("Lỗi AI. Hãy thử lại.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        showCloseButton={false}
        className="w-full sm:max-w-[540px] p-0 overflow-hidden border-l border-border bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl shadow-2xl"
      >
        <div className="flex flex-col h-full">
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between px-6 pt-8 pb-4 relative z-10">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                {promotion ? (
                  <>
                    <Zap className="size-6 text-primary" />
                    <span>Sửa khuyến mãi</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-6 text-primary" />
                    <span>Thêm khuyến mãi</span>
                  </>
                )}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {promotion ? "Cập nhật chương trình khuyến mãi hiện tại." : "Tạo chương trình ưu đãi mới cho khách hàng."}
              </SheetDescription>
            </SheetHeader>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="rounded-full hover:bg-white/10"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-32 custom-scrollbar">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <ImagePlus className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Banner Khuyến mãi</h3>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className={cn(
                  "relative group aspect-[21/9] w-full rounded-2xl overflow-hidden border-2 border-dashed bg-secondary/50 transition-all duration-300",
                  form.image ? "border-solid border-primary/50 shadow-lg shadow-primary/10" : "border-border hover:border-primary/50"
                )}>
                  {form.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.image} alt="Preview" className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="size-8 rounded-full"
                          onClick={() => setForm({ ...form, image: "" })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center">
                      <Upload className="size-8 mb-1" />
                      <span className="text-xs">Tải ảnh lên hoặc dán URL (Kích thước gợi ý: 1200x500)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Tải ảnh khuyến mãi lên"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-2 rounded-xl border-border"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    <LinkIcon className="size-4" />
                    {showUrlInput ? "Quay về tải lên" : "Dùng URL ảnh"}
                  </Button>
                </div>
                
                {showUrlInput && (
                  <Input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="bg-secondary/50 border-border rounded-xl"
                  />
                )}
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Info className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin chi tiết</h3>
              </div>
              
              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tên chương trình</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="VD: Flash Sale 30/4" 
                    className="h-11 bg-white/50 dark:bg-white/5 border-border rounded-xl focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày bắt đầu</Label>
                    <div className="relative">
                      <Input 
                        type="date"
                        value={form.start_date} 
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                        className="h-11 bg-white/50 dark:bg-white/5 border-border rounded-xl focus:ring-primary/20"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày kết thúc</Label>
                    <div className="relative">
                      <Input 
                        type="date"
                        value={form.end_date} 
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                        className="h-11 bg-white/50 dark:bg-white/5 border-border rounded-xl focus:ring-primary/20"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Giá đồng giá (tùy chọn)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={form.fixed_price} 
                      onChange={(e) => setForm({ ...form, fixed_price: e.target.value })} 
                      placeholder="0" 
                      className="h-11 pl-9 bg-white/50 dark:bg-white/5 border-border rounded-xl focus:ring-primary/20"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₫</span>
                    <CircleDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white/50 p-4 dark:bg-white/5">
                  <div>
                    <Label className="text-sm font-bold">Hiển thị ưu đãi</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bật để hiện popup trên trang chủ và áp dụng giá khuyến mãi.
                    </p>
                  </div>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: Boolean(checked) })}
                    aria-label="Bật tắt khuyến mãi"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mô tả</h3>
                </div>
                
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAIDescription}
                  disabled={aiLoading || !form.name}
                  className="h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight bg-linear-to-r from-violet-600 to-indigo-600 hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 disabled:opacity-40"
                >
                  {aiLoading ? (
                    <><Loader2 className="mr-1 size-3 animate-spin" /> Đang tạo...</>
                  ) : (
                    <><Sparkles className="mr-1 size-3" /> Tạo mô tả AI</>
                  )}
                </Button>
              </div>
              
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Điều kiện áp dụng, chi tiết chương trình..."
                className="min-h-[120px] bg-secondary/50 border-border rounded-2xl"
              />
              {aiError && <p className="text-destructive text-xs italic">{aiError}</p>}
            </section>

            {saveError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <Info className="size-4 shrink-0" />
                {saveError}
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background/90 to-transparent pt-12 pointer-events-auto">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-2xl border-border hover:bg-secondary"
              >
                Hủy
              </Button>
              <Button 
                onClick={save} 
                disabled={isSaving || !form.name || !form.image || !form.start_date || !form.end_date}
                className="flex-[2] h-12 rounded-2xl font-bold bg-primary text-white hover:bg-primary-dark shadow-primary/20"
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 size-5 animate-spin" /> {saveStatus || "Đang lưu..."}</>
                ) : (
                  <>
                    {promotion ? <Check className="mr-2 size-5" /> : <Plus className="mr-2 size-5" />}
                    {promotion ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
