"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Navigation, 
  Globe,
  Loader2,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type ProfileData = {
  user_id: string;
  full_name: string;
  phone_number: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type SaveAdditional = {
  latitude?: number;
  longitude?: number;
};

// Dynamically import the Map component for SSR safety
const AddressEditModal = dynamic(() => import("./AddressEditModal"), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card p-8 rounded-3xl border border-border flex flex-col items-center gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Đang tải bản đồ...</p>
      </div>
    </div>
  )
});

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      console.log("[ProfilePage] No user, skipping fetch and setting loading to false");
      return;
    }
    setLoading(true);
    let didCancel = false;
    // Explicitly use .maybeSingle() like profile.service.ts
    const fetchProfile = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/profile?user_id=${encodeURIComponent(String(user.id))}`, {
          headers,
        });
        const result = await res.json();

        if (!res.ok) {
          console.error("[ProfileService] select error:", result);
          if (!didCancel) setLoading(false);
          return;
        }

        const data = result.profile;
        if (!didCancel) {
          setProfile({
            user_id: user.id,
            full_name: data?.full_name ?? user.name ?? '',
            phone_number: data?.phone_number ?? user.phone ?? '',
            address: data?.address ?? '',
            latitude: data?.latitude ?? undefined,
            longitude: data?.longitude ?? undefined,
          });
        }
      } catch (err) {
        console.error("[ProfileService] catch error:", err);
        if (!didCancel) setProfile({
          user_id: user.id,
          full_name: user.name ?? '',
          phone_number: user.phone ?? ''
        });
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchProfile();
    return () => { didCancel = true; };
  }, [user]);

  const handleEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(value || "");
  };

  const handleSave = async (
    field: string,
    value: string,
    additional?: SaveAdditional,
  ) => {
    if (!user) return;

    // Always include all address fields if updating address
    let payload: Record<string, string | number | null> = { user_id: user.id };
    if (field === "address") {
      payload = {
        user_id: user.id,
        address: value,
        latitude: additional?.latitude ?? profile?.latitude ?? null,
        longitude: additional?.longitude ?? profile?.longitude ?? null,
      };
    } else {
      payload[field] = value !== undefined ? value : null;
      if (additional) {
        for (const key in additional) {
          if (additional[key] !== undefined) {
            payload[key] = additional[key];
          }
        }
      }
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        console.error('[ProfileService] update error', result);
        toast.error(result.error || 'Lỗi khi lưu thay đổi');
        return;
      }

      const updated = result.profile;
      setProfile({
        user_id: user.id,
        full_name: updated?.full_name ?? user.name ?? '',
        phone_number: updated?.phone_number ?? user.phone ?? '',
        address: updated?.address ?? '',
        latitude: updated?.latitude ?? undefined,
        longitude: updated?.longitude ?? undefined,
      });
      toast.success('Cập nhật hồ sơ thành công!');
      setEditField(null);
      setShowAddressModal(false);
    } catch (error: unknown) {
      console.error('[ProfileService] catch update error', error);
      const message = error instanceof Error ? error.message : "Profile write failed";
      toast.error(message);
    }
  };

  const handleLogout = async () => {
    logout();
    router.replace("/login");

    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (e) {
      console.error("Supabase sign out error:", e);
    }
  };

  if (!user) return <div className="p-8 text-center text-zinc-400">Vui lòng đăng nhập.</div>;
  
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* Header Card */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <h1 className="text-xl font-bold text-foreground mb-1">
          Xin chào, {user.email}
        </h1>
        <p className="text-muted-foreground text-sm">Thông tin cá nhân</p>
      </div>

      {/* Info Cards Container */}
      <div className="space-y-3">
        <ProfileCard
          label="Họ và tên"
          value={profile?.full_name}
          icon={UserIcon}
          editable
          onEdit={() => handleEdit("full_name", profile?.full_name)}
        />
        <ProfileCard
          label="Email"
          value={user.email}
          icon={Mail}
        />
        <ProfileCard
          label="Số điện thoại"
          value={profile?.phone_number}
          icon={Phone}
          editable
          onEdit={() => handleEdit("phone_number", profile?.phone_number)}
        />
        <ProfileCard
          label="Địa chỉ"
          value={profile?.address}
          icon={MapPin}
          editable
          onEdit={() => setShowAddressModal(true)}
        />
        <ProfileCard
          label="Vĩ độ"
          value={profile?.latitude?.toString()}
          icon={Navigation}
        />
        <ProfileCard
          label="Kinh độ"
          value={profile?.longitude?.toString()}
          icon={Globe}
        />

        {/* Logout Card - Matching Arrow Direction */}
        <div 
          onClick={handleLogout}
          className="flex items-center gap-5 rounded-2xl bg-card p-5 shadow-sm border border-border transition-all hover:bg-destructive/10 hover:border-destructive/20 cursor-pointer group mt-6"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <LogOut className="size-6 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[17px] text-destructive">Đăng xuất</div>
            <div className="text-[12px] text-muted-foreground font-medium">Thoát khỏi phiên làm việc hiện tại</div>
          </div>
        </div>
      </div>

      {/* Address Edit Modal with Map */}
      {showAddressModal && (
        <AddressEditModal
          initialAddress={profile?.address}
          initialLat={profile?.latitude}
          initialLng={profile?.longitude}
          onSave={(addr, lat, lng) => handleSave("address", addr, { latitude: lat, longitude: lng })}
          onClose={() => setShowAddressModal(false)}
        />
      )}

      {/* Basic Edit modal for Name/Phone */}
      {editField && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Chỉnh sửa {editField === "full_name" ? "Họ và tên" : editField === "phone_number" ? "Số điện thoại" : "Địa chỉ"}
            </h3>
            <Input 
              value={editValue} 
              onChange={e => setEditValue(e.target.value)} 
              className="mb-6 bg-secondary border-input text-foreground h-12 rounded-xl focus-visible:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button 
                variant="ghost" 
                onClick={() => setEditField(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-11 px-6 rounded-xl"
              >
                Hủy
              </Button>
              <Button 
                onClick={() => handleSave(editField, editValue)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 rounded-xl"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProfileCardProps {
  label: string;
  value?: string;
  icon: ComponentType<{ className?: string }>;
  editable?: boolean;
  onEdit?: () => void;
}

function ProfileCard({ label, value, icon: Icon, editable, onEdit }: ProfileCardProps) {
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-card p-5 shadow-sm border border-border transition-colors hover:border-border/50 group">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary/50">
        <Icon className="size-6 text-emerald-500/70" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-muted-foreground font-medium mb-1 uppercase tracking-wider">{label}</div>
        <div className={`font-semibold text-[17px] truncate ${value ? 'text-foreground' : 'text-muted-foreground/60'}`}>
          {value || "Chưa cập nhật"}
        </div>
      </div>

      {editable && (
        <button 
          onClick={onEdit}
          className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 -mr-2"
        >
          edit
        </button>
      )}
    </div>
  );
}


