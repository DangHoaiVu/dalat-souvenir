export const ADMIN_EMAILS = [
  "danghoaivu2004@gmail.com",
  "admin@shopluuniem.vn",
];

export function isAdminEmail(email?: string | null): boolean {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalizedEmail);
}
