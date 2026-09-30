import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import {
  FROM_EMAIL,
  REPLY_TO,
  SITE_URL,
  button,
  emailLayout,
  resendRequest,
} from "@/lib/email-layout.server";

// One-time announcement: the referral program is live.
// Guarded by a secret header and a log table so it can only ever send once.
export const Route = createFileRoute("/api/public/referral-announcement")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const provided = request.headers.get("x-announce-secret") ?? "";
        const { data: secretRow } = await supabaseAdmin
          .from("internal_secrets" as never)
          .select("value")
          .eq("name", "referral_announce")
          .maybeSingle();
        const expected = (secretRow as { value?: string } | null)?.value ?? "";
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        // One-shot guard: never send this announcement twice.
        const { data: already } = await supabaseAdmin
          .from("referral_announce_log" as never)
          .select("sent_at")
          .limit(1)
          .maybeSingle();
        if (already) {
          return Response.json({ sent: false, reason: "already_sent" });
        }

        const { data: members, error: pErr } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("status", "accepted");
        if (pErr) return new Response(pErr.message, { status: 500 });
        const emails = (members ?? []).map((m) => m.email).filter(Boolean);
        if (emails.length === 0) {
          return Response.json({ sent: false, reason: "no_recipients" });
        }

        const html = emailLayout(
          "Invite friends, earn crypto for life",
          `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">New: your referral link is live</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 12px;">Every TaskReddit member now has a personal invitation link. Share it, and you earn crypto on every person who joins through you — <strong>for life</strong>.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
<tr><td style="background:#FFF4EF;border:1px solid #FFD9C7;border-radius:8px;padding:16px;">
<p style="color:#0F172A;font-size:16px;margin:0 0 8px;"><strong style="color:#FF4500;">$1.00</strong> for every invited friend whose account gets validated</p>
<p style="color:#0F172A;font-size:16px;margin:0;"><strong style="color:#FF4500;">$0.50</strong> for every mission your referral completes and gets approved</p>
</td></tr></table>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">There is no cap and no expiry: as long as your referrals keep completing missions, you keep earning. Your rewards are paid in USDC, just like your missions.</p>
${button(`${SITE_URL}/referrals`, "Get my referral link")}
<p style="color:#64748B;font-size:14px;margin-top:24px;">Find your personal link anytime on the Referrals page of your dashboard.</p>`,
          `<br>You receive this because you are a verified TaskReddit member.`,
        );

        for (let i = 0; i < emails.length; i += 100) {
          const chunk = emails.slice(i, i + 100).map((to) => ({
            from: FROM_EMAIL,
            to: [to],
            reply_to: REPLY_TO,
            subject: "New on TaskReddit: invite friends, earn crypto for life",
            html,
          }));
          await resendRequest("/emails/batch", chunk);
        }

        await supabaseAdmin
          .from("referral_announce_log" as never)
          .insert({ recipient_count: emails.length } as never);

        return Response.json({ sent: true, recipients: emails.length });
      },
    },
  },
});
