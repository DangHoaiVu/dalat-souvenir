"use client";

import Image from "next/image";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import ProductSheet from "@/components/admin/ProductSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product, Category } from "@/types";

const formatPrice = (value: number) => `${(value ?? 0).toLocaleString("vi-VN")}đ`;

export default function Page() {
  const [list, setList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [openSheet, setOpenSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/products").then((res) => res.json()),
      fetch("/api/categories").then((res) => res.json()),
    ])
      .then(([productsData, categoriesData]) => {
        setList(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Lỗi khi tải dữ liệu");
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () =>
      list.filter(
        (product) =>
          (product.name?.toLowerCase?.() || "").includes(search.toLowerCase()) &&
          (category === "all" || product.category_id === category)
      ),
    [list, search, category],
  );

  const onSave = (payload: any) => {
    const idField = payload.product_id ? 'product_id' : 'id';
    setList((prev) => {
      const exists = prev.some((item) => item[idField] === payload[idField]);
      return exists
        ? prev.map((item) => (item[idField] === payload[idField] ? payload : item))
        : [payload, ...prev];
    });
    toast.success("Đã lưu sản phẩm");
  };

  return (
    <div>
      <ProductSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        product={editingProduct}
        onSave={onSave}
        categories={categories}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Quản lý sản phẩm</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} sản phẩm</p>
        </div>
        <Button
          className="bg-primary text-white hover:bg-primary-dark"
          onClick={() => {
            setEditingProduct(null);
            setOpenSheet(true);
          }}
        >
          <Plus className="mr-1 size-4" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <Input placeholder="Tìm theo tên..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Lọc theo danh mục"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((item) => (
            <option key={item.category_id || item.id} value={item.category_id || item.slug} className="bg-background text-foreground">
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy sản phẩm nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.product_id || product.id}>
                  <TableCell>
                    {(product.image || (product.images && product.images[0])) && (
                      <img
                        src={product.image || (product.images && product.images[0])}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover size-10"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.categories?.name || product.category?.name || categories.find(c => c.category_id === product.category_id)?.name || "—"}
                    </Badge>
                  </TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell className={product.stock < 10 ? "text-red-600" : ""}>
                  {product.stock}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setOpenSheet(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() =>
                        setList((prev) => prev.filter((item) => (item.product_id || item.id) !== (product.product_id || product.id)))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      <ProductSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        product={editingProduct}
        onSave={onSave}
        categories={categories}
      />
    </div>
  );
}
