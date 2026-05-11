"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";

interface LogoutConfirmDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LogoutConfirmDialog({ 
  children, 
  open: externalOpen, 
  onOpenChange: setExternalOpen 
}: LogoutConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const handleLogout = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      toast.loading("Đang đăng xuất...", { id: "logout-dialog" });

      // Optimistic local logout keeps the UI responsive.
      logout();
      router.replace("/login");
      
      setOpen(false);
      toast.success("Đã đăng xuất", { id: "logout-dialog" });

      const signOutWithTimeout = Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
      await signOutWithTimeout;
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Lỗi khi đăng xuất", { id: "logout-dialog" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LogOut className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">Xác nhận đăng xuất</DialogTitle>
          <DialogDescription className="text-center">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Shop Lưu Niệm Đà Lạt không?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-row gap-2 sm:justify-center">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleLogout}
            disabled={isLoading}
          >
            Đăng xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
