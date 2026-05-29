import { authFetch } from "@/lib/auth-fetch";

type AdminImageKind = "product" | "promotion";

export async function uploadAdminImage(file: Blob | File, kind: AdminImageKind, fileName: string) {
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file, fileName);

  const response = await authFetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => null) as { url?: string; error?: string } | null;

  if (!response.ok || !result?.url) {
    throw new Error(result?.error || "Không thể tải ảnh lên");
  }

  return result.url;
}
