import { supabase } from "@/lib/supabaseClient";

export async function authHeaders(init?: HeadersInit): Promise<HeadersInit> {
  const headers = new Headers(init);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: await authHeaders(init.headers),
  });
}
