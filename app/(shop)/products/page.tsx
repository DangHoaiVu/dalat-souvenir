"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, PackageSearch, Search, X } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
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
import type { Product } from "@/types";

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
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageFallback() {
  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function ProductsPageContent() {
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
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const slug = searchParams.get("category");
    if (!slug || categories.length === 0) return;
    const match = categories.find((category) => category.slug === slug);
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

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-primary">Tìm sản phẩm</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tertiary" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tên hoặc mô tả sản phẩm..."
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-primary">Danh mục</h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between text-sm text-secondary hover:text-accent">
            <span className="font-medium">Tất cả</span>
            <input type="radio" name="category" className="accent-[--color-accent]" checked={selectedCategory === "all"} onChange={() => setSelectedCategory("all")} />
          </label>
          {categories.map((category) => (
            <label key={category.category_id} className="flex cursor-pointer items-center justify-between text-sm text-secondary hover:text-accent">
              <span className="font-medium">{category.name}</span>
              <input type="radio" name="category" className="accent-[--color-accent]" checked={selectedCategory === category.category_id} onChange={() => setSelectedCategory(category.category_id)} />
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-primary">Khoảng giá</h3>
        <div className="space-y-3">
          <Input type="number" placeholder="Từ (VD: 0)" value={draftMinPrice} onChange={(event) => setDraftMinPrice(event.target.value)} />
          <Input type="number" placeholder="Đến (VD: 500000)" value={draftMaxPrice} onChange={(event) => setDraftMaxPrice(event.target.value)} />
          <Button type="button" variant="outline" className="w-full" onClick={applyPriceFilter}>
            Áp dụng
          </Button>
        </div>
      </div>

      {hasFilter && (
        <Button type="button" variant="ghost" className="w-full text-error hover:text-error" onClick={clearAllFilters}>
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-7 sm:px-6 sm:py-10 lg:px-10 2xl:px-12">
      <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Cửa hàng</p>
          <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">Sản phẩm</h1>
          <p className="mt-2 text-sm font-medium text-secondary">
            Hiển thị {filteredProducts.length} sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortValue)}>
              <SelectTrigger className="w-[210px] border-[--color-border] bg-surface font-medium shadow-sm">
                <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="border-[--color-border] bg-surface">
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="md:hidden" />}>
              <Filter className="size-4" />
              Lọc
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-xl border-[--color-border] bg-surface pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle>Lọc & Sắp xếp</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filterPanel}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {hasFilter && (
        <div className="mb-6 flex flex-wrap gap-2">
          {searchQuery.trim().length > 0 && (
            <Badge variant="outline" className="gap-2 rounded-full border-[--color-border] bg-surface px-3 py-1">
              Tìm: <span className="font-bold">{searchQuery}</span>
              <button type="button" onClick={() => setSearchQuery("")} className="ml-1 transition-colors hover:text-error">
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="outline" className="gap-2 rounded-full border-[--color-border] bg-surface px-3 py-1">
              Mục: <span className="font-bold">{categories.find((category) => category.category_id === selectedCategory)?.name}</span>
              <button type="button" onClick={() => setSelectedCategory("all")} className="ml-1 transition-colors hover:text-error">
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="grid min-w-0 items-start gap-5 sm:gap-8 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="sticky top-28 hidden md:block">
          <Card variant="flat" className="border-[--color-border-strong] p-6 shadow-md">
            {filterPanel}
          </Card>
        </aside>

        {isLoading ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                className="border-[--color-border-strong] shadow-md hover:border-accent/60"
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center p-12 text-center">
            <div className="mb-6 flex size-24 items-center justify-center rounded-full border border-[--color-border] bg-surface-muted">
              <PackageSearch className="size-10 text-tertiary" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-primary">Không tìm thấy sản phẩm</h3>
            <p className="max-w-md text-secondary">
              Không có sản phẩm nào khớp với bộ lọc hiện tại. Hãy thử đổi danh mục, từ khóa hoặc khoảng giá.
            </p>
            <Button variant="outline" className="mt-8" onClick={clearAllFilters}>
              Xóa bộ lọc
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
