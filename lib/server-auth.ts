import { createClient } from "@supabase/supabase-js";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { isAdminEmail } from "@/lib/admin-auth";

type AuthResult =
  | { ok: true; user: SupabaseUser; token: string; role: "admin" | "seller" }
  | { ok: false; status: 401 | 403; error: string };

function getBearerToken(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

function createUserSupabaseClient(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be set");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireAdmin(req: Request | NextRequest): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: "Missing auth token" };
  }

  const userSupabase = createUserSupabaseClient(token);
  const { data: authData, error: authError } = await userSupabase.auth.getUser(token);

  if (authError || !authData.user) {
    return { ok: false, status: 401, error: authError?.message || "Invalid auth token" };
  }

  if (isAdminEmail(authData.user.email)) {
    return { ok: true, user: authData.user, token, role: "admin" };
  }

  try {
    const { data, error } = await userSupabase.rpc("is_seller");
    if (!error && data === true) {
      return { ok: true, user: authData.user, token, role: "seller" };
    }
  } catch {
    // Fall through to forbidden. Some deployments may not have the RPC yet.
  }

  return { ok: false, status: 403, error: "Forbidden" };
}

export async function getOptionalUser(req: Request | NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return { user: null, token: null, error: null };
  }

  const userSupabase = createUserSupabaseClient(token);
  const { data, error } = await userSupabase.auth.getUser(token);
  return {
    user: data.user ?? null,
    token,
    error: error?.message ?? null,
  };
}
