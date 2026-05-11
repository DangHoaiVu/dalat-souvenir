import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabaseClient";

const supabase = createAdminSupabaseClient();

async function getRequestUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { user: null, error: "Missing auth token" };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: error?.message || "Invalid auth token" };
  }

  return { user: data.user, error: null };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const { user, error: authError } = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  if (user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone_number, address, latitude, longitude")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { user_id, full_name, phone_number, address, latitude, longitude } = body;

  if (!user_id) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const { user, error: authError } = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  if (user.id !== String(user_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, string | number | null> = { user_id };
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone_number !== undefined) updates.phone_number = phone_number;
  if (address !== undefined) updates.address = address;
  if (latitude !== undefined) updates.latitude = latitude;
  if (longitude !== undefined) updates.longitude = longitude;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(updates, { onConflict: "user_id" })
    .select("full_name, phone_number, address, latitude, longitude")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
