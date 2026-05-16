"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, PackageSearch, Search, X } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import ProductGridSkeleton from "@/components/shop/ProductGridSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";

function removeAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

type SortValue = "newest" | "name-asc" | "name-desc" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortValue, string> = {
  newest: "Mới nhất",
  "name-asc": "A-Z",
  "name-desc": "Z-A",
  "price-asc": "Giá thấp đến cao",
  "price-desc": "Giá cao đến thấp",
};

type ProductCategory = {
  category_id: string;
  name: string;
  slug?: string;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/products").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const slug = searchParams.get("category");
    if (!slug || categories.length === 0) return;
    const match = categories.find((c) => c.slug === slug);
    if (match?.category_id) setSelectedCategory(match.category_id);
  }, [searchParams, categories]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = removeAccents(searchQuery.trim().toLowerCase());
    const list = products.filter((product) => {
      const matchCategory = selectedCategory === "all" || product.category_id === selectedCategory;
      const matchPrice = product.price >= minPrice && product.price <= maxPrice;
      const normalizedName = removeAccents(product.name.toLowerCase());
      const normalizedDesc = removeAccents((product.description ?? "").toLowerCase());

      const matchSearch =
        normalizedQuery.length === 0 ||
        normalizedName.includes(normalizedQuery) ||
        normalizedDesc.includes(normalizedQuery);

      return matchCategory && matchPrice && matchSearch;
    });

    if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    if (sortBy === "name-desc") return [...list].sort((a, b) => b.name.localeCompare(a.name, "vi"));

    return [...list].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  }, [products, selectedCategory, minPrice, maxPrice, sortBy, searchQuery]);

  const hasFilter =
    selectedCategory !== "all" || minPrice !== 0 || maxPrice !== 500000 || searchQuery.trim().length > 0;

  const applyPriceFilter = () => {
    setMinPrice(Number(draftMinPrice || 0));
    setMaxPrice(Number(draftMaxPrice || 500000));
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setMinPrice(0);
    setMaxPrice(500000);
    setSortBy("newest");
  };

  function renderSidebar() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Tìm sản phẩm</h3>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tên hoặc mô tả sản phẩm..."
              className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] pl-9"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Danh mục</h3>
          <div className="space-y-3">
            <label className="group flex cursor-pointer items-center justify-between text-sm">
              <span className="font-medium transition-colors group-hover:text-primary">Tất cả</span>
              <input
                type="radio"
                name="category"
                className="accent-primary"
                checked={selectedCategory === "all"}
                onChange={() => setSelectedCategory("all")}
              />
            </label>
            {categories.map((category) => (
              <label
                key={category.category_id}
                className="group flex cursor-pointer items-center justify-between text-sm"
              >
                <span className="font-medium transition-colors group-hover:text-primary">{category.name}</span>
                <input
                  type="radio"
                  name="category"
                  className="accent-primary"
                  checked={selectedCategory === category.category_id}
                  onChange={() => setSelectedCategory(category.category_id)}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Khoảng giá</h3>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Từ (VD: 0)"
              value={draftMinPrice}
              onChange={(event) => setDraftMinPrice(event.target.value)}
              className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)]"
            />
            <Input
              type="number"
              placeholder="Đến (VD: 500000)"
              value={draftMaxPrice}
              onChange={(event) => setDraftMaxPrice(event.target.value)}
              className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)]"
            />
            <GlassButton variant="pill" className="mt-2 w-full" onClick={applyPriceFilter}>
              Áp dụng
            </GlassButton>
          </div>
        </div>

        {hasFilter && (
          <GlassButton
            variant="pill"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={clearAllFilters}
          >
            Xóa bộ lọc
          </GlassButton>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Sản phẩm</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Hiển thị {filteredProducts.length} sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortValue)}>
              <SelectTrigger className="w-[210px] rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] font-medium shadow-[var(--shadow-sm)]">
                <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)]">
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Sheet>
            <SheetTrigger className="inline-flex md:hidden">
              <Button variant="outline" className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)]">
                <Filter className="mr-2 size-4" />
                Lọc
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-[90vh] overflow-y-auto rounded-b-3xl border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <SheetHeader>
                <SheetTitle>Lọc & Sắp xếp</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{renderSidebar()}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {hasFilter && (
        <div className="mb-8 flex flex-wrap gap-2">
          {searchQuery.trim().length > 0 && (
            <Badge variant="outline" className="gap-2 rounded-full border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 shadow-[var(--shadow-sm)]">
              Tìm: <span className="font-bold">{searchQuery}</span>
              <button type="button" onClick={() => setSearchQuery("")} className="ml-1 transition-colors hover:text-destructive">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="outline" className="gap-2 rounded-full border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 shadow-[var(--shadow-sm)]">
              Mục: <span className="font-bold">{categories.find((category) => category.category_id === selectedCategory)?.name}</span>
              <button type="button" onClick={() => setSelectedCategory("all")} className="ml-1 transition-colors hover:text-destructive">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {(minPrice !== 0 || maxPrice !== 500000) && (
            <Badge variant="outline" className="gap-2 rounded-full border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 shadow-[var(--shadow-sm)]">
              Giá: <span className="font-bold">{minPrice.toLocaleString("vi-VN")}đ - {maxPrice.toLocaleString("vi-VN")}đ</span>
              <button
                type="button"
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(500000);
                  setDraftMinPrice("");
                  setDraftMaxPrice("");
                }}
                className="ml-1 transition-colors hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="grid items-start gap-8 md:grid-cols-[280px_1fr]">
        <aside className="sticky top-28 hidden md:block">
          <GlassCard className="rounded-2xl p-6">
            {renderSidebar()}
          </GlassCard>
        </aside>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <GlassCard className="flex flex-col items-center p-12 text-center">
            <div className="mb-6 flex size-24 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] shadow-inner">
              <PackageSearch className="size-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-foreground">Không tìm thấy sản phẩm</h3>
            <p className="max-w-md text-muted-foreground">
              Chúng tôi không tìm thấy sản phẩm nào khớp với bộ lọc của bạn. Hãy thử thay đổi danh mục hoặc khoảng giá.
            </p>
            <GlassButton variant="secondary" className="mt-8" onClick={clearAllFilters}>
              Xóa bộ lọc
            </GlassButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
