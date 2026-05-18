import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabaseClient";

const supabase = createAdminSupabaseClient();

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

function getDisplayName(user: User) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.email ||
    "Khach hang"
  );
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);

  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || "Invalid auth token" }, { status: 401 });
  }

  const user = authData.user;
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("full_name, phone_number")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message, code: existingError.code }, { status: 500 });
  }

  const profilePayload = {
    user_id: user.id,
    full_name: existing?.full_name || getDisplayName(user),
    phone_number: existing?.phone_number || user.user_metadata?.phone || null,
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select("full_name, phone_number")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
