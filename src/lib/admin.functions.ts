import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes a member account (admins only). */
export const deleteMemberAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

    const { data: targetRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (targetRole) throw new Error("You cannot delete another admin account.");

    const { error } = await context.supabase
      .from("member_deletion_requests")
      .insert({ requested_by: context.userId, target_user_id: data.userId });
    if (error) throw new Error(error.message);

    return { ok: true };
  });
