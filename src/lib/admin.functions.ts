import { createClient } from "@supabase/supabase-js";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const requireAdminFunctionAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
    const publishableKey =
      process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const authorization = getRequest()?.headers.get("authorization");

    if (!supabaseUrl || !publishableKey) {
      throw new Error("The Lovable Cloud connection is unavailable. Please try again.");
    }
    if (!authorization?.startsWith("Bearer ")) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const token = authorization.slice("Bearer ".length);
    const supabase = createClient<Database>(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getClaims(token);
    const userId = data?.claims?.sub;

    if (error || !userId) throw new Error("Your session has expired. Please sign in again.");
    return next({ context: { supabase, supabaseUrl, userId } });
  },
);

function createPrivilegedFetch(serviceKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (headers.get("Authorization") === `Bearer ${serviceKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", serviceKey);
    return fetch(input, { ...init, headers });
  };
}

/** Permanently deletes a member account (admins only). */
export const deleteMemberAccount = createServerFn({ method: "POST" })
  .middleware([requireAdminFunctionAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw new Error(roleError.message);
    if (!role) throw new Error("Admins only.");
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error("The administrative Cloud connection is unavailable. Please try again.");
    }
    const supabaseAdmin = createClient<Database>(context.supabaseUrl, serviceKey, {
      global: { fetch: createPrivilegedFetch(serviceKey) },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (targetRole) throw new Error("You cannot delete another admin account.");

    await supabaseAdmin.from("admin_favorites").delete().eq("profile_id", data.userId);
    await supabaseAdmin.from("submissions").delete().eq("user_id", data.userId);
    await supabaseAdmin
      .from("missions")
      .update({ reserved_by: null, reserved_until: null })
      .eq("reserved_by", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
