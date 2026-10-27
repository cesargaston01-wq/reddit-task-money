import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  FROM_EMAIL,
  REPLY_TO,
  SITE_URL,
  button,
  emailLayout,
  escapeHtml,
  resendRequest,
} from "@/lib/email-layout.server";

// Called by the database when an admin approves an account.
// Sends the "your account is approved" email once per member.
const body = z.object({ user_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/account-approved")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const provided = request.headers.get("x-digest-secret") ?? "";
        const { data: secretRow } = await supabaseAdmin
          .from("internal_secrets" as never)
          .select("value")
          .eq("name", "digest_cron")
          .maybeSingle();
        const expected = (secretRow as { value?: string } | null)?.value ?? "";
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ sent: false, reason: "invalid" }, { status: 400 });
        const userId = parsed.data.user_id;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name, status")
          .eq("id", userId)
          .maybeSingle();
        if (!profile?.email || profile.status !== "accepted") {
          return Response.json({ sent: false, reason: "not_accepted" });
        }

        // One approval email per member, ever.
        const { error: logErr } = await supabaseAdmin
          .from("account_approval_email_log")
          .insert({ user_id: userId });
        if (logErr) return Response.json({ sent: false, reason: "already_sent" });

        const name = profile.full_name ? escapeHtml(profile.full_name) : "";
        const subject = "Your TaskReddit account is approved 🎉";
        const content = `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">You're approved${name ? `, ${name}` : ""}!</h1>
          <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">Good news: your TaskReddit account has been reviewed and approved.</p>
          <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">You can start earning money right now. Pick a mission, leave a natural comment, and get paid in crypto (USDC) for every approved contribution.</p>
          ${button(`${SITE_URL}/opportunities/comments`, "Start earning now")}
          <p style="color:#64748B;font-size:14px;line-height:1.5;margin-top:24px;">Tip: invite friends from your Referrals page and earn $1 per validated friend plus $0.50 on each of their approved missions — for life.</p>`;

        try {
          await resendRequest("/emails", {
            from: FROM_EMAIL,
            to: [profile.email],
            reply_to: REPLY_TO,
            subject,
            html: emailLayout(subject, content),
          });
        } catch (err) {
          console.error("account-approved email failed", err);
          await supabaseAdmin.from("account_approval_email_log").delete().eq("user_id", userId);
          return Response.json({ sent: false, reason: "send_failed" }, { status: 500 });
        }

        return Response.json({ sent: true });
      },
    },
  },
});
