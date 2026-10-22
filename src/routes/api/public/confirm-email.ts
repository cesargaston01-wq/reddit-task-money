import { createFileRoute } from "@tanstack/react-router";

// Confirms an email address from a signed link, then sends the user to the login page.
export const Route = createFileRoute("/api/public/confirm-email")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const uid = url.searchParams.get("uid") ?? "";
        const exp = url.searchParams.get("exp") ?? "";
        const sig = url.searchParams.get("sig") ?? "";
        const { verifyConfirmParams } = await import("@/lib/email-confirm-token.server");
        const ok = await verifyConfirmParams(uid, exp, sig);
        if (!ok) return Response.redirect(`${url.origin}/auth?confirmed=invalid`, 302);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, { email_confirm: true });
        if (error) {
          console.error("confirm-email failed", error.message);
          return Response.redirect(`${url.origin}/auth?confirmed=invalid`, 302);
        }
        return Response.redirect(`${url.origin}/auth?confirmed=1`, 302);
      },
    },
  },
});
