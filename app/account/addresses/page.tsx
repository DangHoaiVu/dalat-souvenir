"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Address } from "@/types";

const initialAddresses: Address[] = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    phone: "0901234567",
    province: "Lâm Đồng",
    district: "TP. Đà Lạt",
    ward: "Phường 1",
    address: "123 Trần Phú",
    isDefault: true,
  },
  {
    id: 2,
    name: "Nguyễn Văn A",
    phone: "0901234567",
    province: "TP.HCM",
    district: "Quận 3",
    ward: "Phường Võ Thị Sáu",
    address: "56 Nguyễn Đình Chiểu",
    isDefault: false,
  },
];

export default function Page() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Address, "id">>({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    address: "",
    isDefault: false,
  });

  const setDefault = (id: Address["id"]) => {
    setAddresses((prev) =>
      prev.map((address) => ({ ...address, isDefault: address.id === id })),
    );
  };

  const removeAddress = (id: Address["id"]) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    setAddresses((prev) => prev.filter((address) => address.id !== id));
    toast.success("Đã xóa địa chỉ");
  };

  const addAddress = () => {
    if (!form.name || !form.phone || !form.province || !form.district || !form.ward || !form.address) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setAddresses((prev) => {
      const next = form.isDefault
        ? prev.map((address) => ({ ...address, isDefault: false }))
        : prev;
      return [...next, { id: Date.now(), ...form }];
    });
    setForm({
      name: "",
      phone: "",
      province: "",
      district: "",
      ward: "",
      address: "",
      isDefault: false,
    });
    setOpen(false);
    toast.success("Thêm địa chỉ thành công");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Địa chỉ giao hàng</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-primary text-white hover:bg-primary/90"
            )}
          >
            + Thêm địa chỉ mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm địa chỉ mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Họ tên</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>SĐT</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Tỉnh/TP</Label>
                <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              </div>
              <div>
                <Label>Quận/Huyện</Label>
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
              <div>
                <Label>Phường/Xã</Label>
                <Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Đặt làm mặc định
              </label>
              <Button onClick={addAddress} className="w-full bg-primary text-white hover:bg-primary-dark">
                Lưu địa chỉ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {addresses.map((address) => (
          <div key={address.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {address.name} - {address.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.address}, {address.ward}, {address.district}, {address.province}
                </p>
              </div>
              {address.isDefault && (
                <Badge className="bg-light text-primary">Mặc định</Badge>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {!address.isDefault && (
                <Button variant="outline" size="sm" onClick={() => setDefault(address.id)}>
                  Đặt làm mặc định
                </Button>
              )}
              <Button variant="ghost" size="sm">
                Sửa
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removeAddress(address.id)}
              >
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
