export const ADMIN_EMAIL = "danghoaivu2004@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return (email ?? "").toLowerCase() === ADMIN_EMAIL;
}
