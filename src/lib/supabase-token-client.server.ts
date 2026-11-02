// Builds a Supabase client that acts as the signed-in user (RLS applies) from a bearer token.
// Falls back to the public VITE_* values baked into the build when runtime env vars are missing.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export async function userClientFromAuthHeader(authHeader: string | null | undefined) {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Server configuration error. Please try again in a minute.");

  const header = authHeader ?? "";
  if (!header.startsWith("Bearer ")) throw new Error("Unauthorized: please sign in again.");
  const token = header.slice(7);
  if (token.split(".").length !== 3) throw new Error("Unauthorized: please sign in again.");

  const supabase = createClient<Database>(url, key, {
    global: { fetch: supabaseFetch(key), headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized: please sign in again.");
  return { supabase, userId: data.claims.sub as string, claims: data.claims };
}
