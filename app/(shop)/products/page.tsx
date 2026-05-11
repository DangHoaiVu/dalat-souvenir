"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, PackageSearch, Search, X } from "lucide-react";

import ProductCard from "@/components/shop/ProductCard";
import ProductGridSkeleton from "@/components/shop/ProductGridSkeleton";
import EmptyState from "@/components/ui/EmptyState";
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

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === "name-asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }
    if (sortBy === "name-desc") {
      return [...list].sort((a, b) => b.name.localeCompare(a.name, "vi"));
    }

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

  // Remove old loading effect, now loading is based on fetch

  function renderSidebar() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">Tìm sản phẩm</h3>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tên hoặc mô tả sản phẩm..."
              className="pl-9 bg-white/40 border-white/50 backdrop-blur-sm focus-visible:ring-primary/50 rounded-xl"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">Danh mục</h3>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between text-sm group">
              <span className="font-medium group-hover:text-primary transition-colors">Tất cả</span>
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
                className="flex cursor-pointer items-center justify-between text-sm group"
              >
                <span className="font-medium group-hover:text-primary transition-colors">{category.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    className="accent-primary"
                    checked={selectedCategory === category.category_id}
                    onChange={() => setSelectedCategory(category.category_id)}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">Khoảng giá</h3>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Từ (VD: 0)"
              value={draftMinPrice}
              onChange={(event) => setDraftMinPrice(event.target.value)}
              className="bg-white/40 border-white/50 backdrop-blur-sm focus-visible:ring-primary/50 rounded-xl"
            />
            <Input
              type="number"
              placeholder="Đến (VD: 500000)"
              value={draftMaxPrice}
              onChange={(event) => setDraftMaxPrice(event.target.value)}
              className="bg-white/40 border-white/50 backdrop-blur-sm focus-visible:ring-primary/50 rounded-xl"
            />
            <GlassButton
              variant="pill"
              className="w-full mt-2"
              onClick={applyPriceFilter}
            >
              Áp dụng
            </GlassButton>
          </div>
        </div>

        {hasFilter && (
          <GlassButton
            variant="pill"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            onClick={clearAllFilters}
          >
            Xóa bộ lọc
          </GlassButton>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-serif font-bold drop-shadow-sm">Sản phẩm</h1>
          <p className="text-sm font-medium text-muted-foreground mt-2">
            Hiển thị {filteredProducts.length} sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortValue)}
            >
              <SelectTrigger className="w-[200px] bg-white/40 border-white/50 backdrop-blur-md rounded-xl font-medium shadow-sm">
                <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white/80 backdrop-blur-xl border-white/50 rounded-xl">
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="name-asc">A-Z</SelectItem>
                <SelectItem value="name-desc">Z-A</SelectItem>
                <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Sheet>
            <SheetTrigger className="inline-flex md:hidden">
              <Button variant="outline" className="rounded-xl bg-white/40 border-white/50 backdrop-blur-md">
                <Filter className="mr-2 size-4" />
                Lọc
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-xl border-b border-white/50 rounded-b-3xl">
              <SheetHeader>
                <SheetTitle className="font-serif">Lọc & Sắp xếp</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{renderSidebar()}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {hasFilter && (
        <div className="mb-8 flex flex-wrap gap-2">
          {searchQuery.trim().length > 0 && (
            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white/40 border-white/50 backdrop-blur-md shadow-sm rounded-full">
              Tìm: <span className="font-bold">{searchQuery}</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="hover:text-destructive transition-colors ml-1"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white/40 border-white/50 backdrop-blur-md shadow-sm rounded-full">
              Mục: <span className="font-bold">{categories.find((category) => category.category_id === selectedCategory)?.name}</span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="hover:text-destructive transition-colors ml-1"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {(minPrice !== 0 || maxPrice !== 500000) && (
            <Badge variant="outline" className="gap-2 px-3 py-1 bg-white/40 border-white/50 backdrop-blur-md shadow-sm rounded-full">
              Giá: <span className="font-bold">{minPrice.toLocaleString("vi-VN")}đ - {maxPrice.toLocaleString("vi-VN")}đ</span>
              <button
                type="button"
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(500000);
                  setDraftMinPrice("");
                  setDraftMaxPrice("");
                }}
                className="hover:text-destructive transition-colors ml-1"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[280px_1fr] items-start">
          <aside className="hidden md:block sticky top-28">
            <GlassCard className="p-6">
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
            <GlassCard className="p-12 text-center flex flex-col items-center">
              <div className="size-24 rounded-full bg-white/30 border border-white/50 flex items-center justify-center mb-6 shadow-inner">
                <PackageSearch className="size-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-muted-foreground max-w-md">
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
