"use client";

import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  ImagePlus, 
  Info,
  Package,
  CircleDollarSign,
  Layers,
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (payload: Product) => void;
  categories: Array<{ category_id?: string; id?: string | number; name: string }>;
}

export default function ProductSheet({
  open,
  onOpenChange,
  product,
  onSave,
  categories,
}: ProductSheetProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle image file selection with local preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local blob URL for preview
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setForm((f) => ({ ...f, image: previewUrl }));
    setShowUrlInput(false);
    setSaveError("");
  };

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    price: "",
    stock: "",
    unit: "",
    description: "",
    image: "",
    importStock: "",
  });

  useEffect(() => {
    // Determine the default category_id if categories are loaded
    const defaultCategoryId = categories && categories.length > 0 
      ? String(categories[0].category_id || categories[0].id) 
      : "";

    if (!product) {
      setForm({
        name: "",
        category_id: defaultCategoryId,
        price: "",
        stock: "",
        unit: "",
        description: "",
        image: "",
        importStock: "",
      });
      setShowUrlInput(false);
      setSelectedFile(null);
      return;
    }

    setForm({
      name: product.name,
      category_id: String(product.category_id || defaultCategoryId),
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      unit: product.unit || "",
      description: product.description || "",
      image: product.image || "",
      importStock: "",
    });

    setSelectedFile(null);
    if (product.image && !product.image.includes('supabase')) {
      setShowUrlInput(true);
    }
  }, [product, categories]);

  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Helper to compress and resize image in browser
  const compressImage = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1024;
        
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

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        console.error("Compression error:", err);
        resolve(file); // Fallback to original on error
      };

      img.src = url;
    });
  };

  const save = async () => {
    setSaveError("");
    setSaveStatus("");
    setIsSaving(true);
    
    let finalImageUrl = form.image;

    // Check if we need to upload a selected file first
    if (selectedFile) {
      try {
        console.log("[ProductSheet] Starting image optimization...");
        setSaveStatus("Đang tối ưu ảnh...");
        const compressedBlob = await compressImage(selectedFile);
        console.log("[ProductSheet] Optimization complete. Original:", selectedFile.size, "Compressed:", (compressedBlob as Blob).size);
        
        setSaveStatus("Đang tải ảnh lên...");
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        console.log("[ProductSheet] Uploading to Supabase bucket 'Products'...");
        const { data, error } = await supabase.storage.from('Products').upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
        });
        
        if (error) {
          console.error("[ProductSheet] Supabase upload error:", error);
          setSaveError('Lỗi tải ảnh lên: ' + error.message);
          setIsSaving(false);
          setSaveStatus("");
          return;
        } else {
          finalImageUrl = supabase.storage.from('Products').getPublicUrl(fileName).data.publicUrl;
          console.log("[ProductSheet] Upload success. URL:", finalImageUrl);
        }
      } catch (err) {
        console.error("[ProductSheet] Unexpected error during image process:", err);
        setSaveError('Đã xảy ra lỗi khi xử lý ảnh.');
        setIsSaving(false);
        setSaveStatus("");
        return;
      }
    }

    setSaveStatus("Đang lưu...");
    // Ensure numeric conversion and handle empty strings as 0 or null
    let stock = Number(form.stock || 0);
    if (product) {
      stock = Number(product.stock) + Number(form.importStock || 0);
    }
    
    const payload = {
      ...(product?.product_id ? { product_id: product.product_id } : {}),
      category_id: form.category_id || null,
      name: form.name,
      price: Number(form.price || 0),
      stock,
      unit: form.unit || null,
      description: form.description || null,
      image: finalImageUrl || null,
    };
    
    try {
      let res;
      if (product) {
        res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: product.id || product.product_id }),
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      
      const result = await res.json();
      if (result.error) {
        setSaveError(result.error);
        setSaveStatus("");
        return;
      }
      onSave(result);
      onOpenChange(false);
    } catch (e) {
      setSaveError("Lỗi khi lưu sản phẩm. Vui lòng thử lại.");
      setSaveStatus("");
    } finally {
      setIsSaving(false);
    }
  };

  // AI Description
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  const handleAIDescription = async () => {
    if (!form.name) return;
    setAiLoading(true);
    setAiError("");
    try {
      const category = categories.find((c) => String(c.category_id ?? c.id) === form.category_id);
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product",
          name: form.name,
          categoryName: category?.name || "",
        }),
      });
      const data = await res.json();
      if (data.description) {
        setForm((f) => ({ ...f, description: data.description }));
      } else {
        setAiError("Không tạo được mô tả. Hãy thử lại.");
      }
    } catch (e) {
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
          {/* Custom Decorative Header Background */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between px-6 pt-8 pb-4 relative z-10">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                {product ? (
                  <>
                    <Layers className="size-6 text-primary" />
                    <span>Sửa sản phẩm</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-6 text-primary" />
                    <span>Thêm sản phẩm</span>
                  </>
                )}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {product ? "Cập nhật thông tin chi tiết cho sản phẩm của bạn." : "Hoàn thiện thông tin để bắt đầu bán sản phẩm mới."}
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
            {/* Media Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <ImagePlus className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hình ảnh sản phẩm</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className={cn(
                  "relative group aspect-square size-40 rounded-3xl overflow-hidden border-2 border-dashed bg-secondary/50 transition-all duration-300",
                  form.image ? "border-solid border-primary/50 shadow-lg shadow-primary/10" : "border-border hover:border-primary/50"
                )}>
                  {form.image ? (
                    <>
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
                      {uploading ? (
                        <Loader2 className="size-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="size-8 mb-1" />
                          <span className="text-xs">Tải ảnh lên hoặc dán URL</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    title="Tải ảnh lên"
                  />
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="flex-1 gap-2 rounded-xl border-border hover:bg-secondary"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                      <LinkIcon className="size-4" />
                      {showUrlInput ? "Dùng tải lên" : "Dùng URL ảnh"}
                    </Button>
                  </div>
                  
                  {showUrlInput && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="text-xs text-zinc-500 mb-1.5 block">Đường dẫn ảnh trực tiếp</Label>
                      <Input
                        type="url"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="bg-secondary/50 border-border rounded-xl focus:ring-primary/20"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-500 italic">
                    Gợi ý: Sử dụng ảnh vuông (1:1), định dạng JPG/PNG/WebP, tối đa 5MB.
                  </p>
                </div>
              </div>
            </section>

            {/* Basic Info Section */}
            <section className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Info className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin cơ bản</h3>
              </div>
              
              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tên sản phẩm</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="Ví dụ: Móc khóa ga Đà Lạt vintage"
                    className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Danh mục</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(val) => setForm({ ...form, category_id: val || "" })}
                  >
                    <SelectTrigger className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20">
                      <SelectValue placeholder="Chọn danh mục sản phẩm">
                        {categories.find(c => String(c.category_id || c.id) === form.category_id)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border rounded-xl">
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.category_id || category.id} 
                          value={String(category.category_id || category.id)}
                          className="hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Pricing & Inventory Section */}
            <section className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <CircleDollarSign className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Giá & Kho hàng</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Giá bán (VNĐ)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={form.price} 
                      onChange={(e) => setForm({ ...form, price: e.target.value })} 
                      placeholder="0" 
                      className="h-11 pl-9 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 font-mono"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₫</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Đơn vị tính</Label>
                  <Input 
                    value={form.unit} 
                    onChange={(e) => setForm({ ...form, unit: e.target.value })} 
                    placeholder="Hộp, Gói, Kg..." 
                    className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20"
                  />
                </div>

                {product ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tồn kho hiện tại</Label>
                      <div className="relative">
                        <Input type="number" value={String(product.stock)} readOnly className="h-11 bg-muted/30 border-border rounded-xl text-muted-foreground font-mono" />
                        <Package className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-emerald-500">Nhập thêm kho</Label>
                      <Input 
                        type="number" 
                        value={form.importStock} 
                        onChange={(e) => setForm({ ...form, importStock: e.target.value })} 
                        placeholder="+ 0" 
                        className="h-11 bg-white/50 dark:bg-white/5 border-emerald-500/30 rounded-xl focus:ring-emerald-500/20 font-mono text-emerald-600 dark:text-emerald-400" 
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 space-y-2">
                    <Label className="text-sm font-medium">Tồn kho ban đầu</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={form.stock} 
                        onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                        placeholder="Số lượng nhập kho lần đầu" 
                        className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 font-mono"
                      />
                      <Package className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Description Section */}
            <section className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mô tả sản phẩm</h3>
                </div>
                
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAIDescription}
                  disabled={aiLoading || !form.name}
                  className={cn(
                    "h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all duration-500",
                    "bg-linear-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-105 active:scale-95",
                    "disabled:opacity-40 disabled:grayscale disabled:scale-100"
                  )}
                >
                  {aiLoading ? (
                    <><Loader2 className="mr-1 size-3 animate-spin" /> Đang tạo...</>
                  ) : (
                    <><Sparkles className="mr-1 size-3" /> Tạo mô tả AI</>
                  )}
                </Button>
              </div>
              
              <div className="relative group">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả các đặc điểm nổi bật, hương vị, cách bảo quản..."
                  className="min-h-[160px] bg-secondary/50 border-border rounded-2xl focus:ring-primary/20 p-4 leading-relaxed"
                />
                {aiLoading && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center rounded-2xl pointer-events-none">
                    <div className="size-full flex items-center justify-center">
                      <div className="h-1 w-1/2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-violet-600 to-indigo-600 animate-[loading-progress_2s_ease-in-out_infinite]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {aiError && <p className="text-destructive text-xs italic">{aiError}</p>}
            </section>

            {saveError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <Info className="size-4 shrink-0" />
                {saveError}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background/90 to-transparent pt-12 pointer-events-none">
            <div className="pointer-events-auto flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-2xl border-border hover:bg-secondary font-semibold"
              >
                Hủy
              </Button>
              <Button 
                onClick={save} 
                disabled={isSaving || !form.name || !form.image}
                className={cn(
                  "flex-[2] h-12 rounded-2xl font-bold text-base transition-all duration-300",
                  "bg-primary text-white hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/20",
                  "disabled:opacity-50 disabled:grayscale"
                )}
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 size-5 animate-spin" /> {saveStatus || "Đang lưu..."}</>
                ) : (
                  <>
                    {product ? <Check className="mr-2 size-5" /> : <Plus className="mr-2 size-5" />}
                    {product ? "Cập nhật sản phẩm" : "Lưu sản phẩm"}
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
