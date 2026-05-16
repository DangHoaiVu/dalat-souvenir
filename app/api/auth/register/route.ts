import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { email, password, name, phone } = await req.json();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
