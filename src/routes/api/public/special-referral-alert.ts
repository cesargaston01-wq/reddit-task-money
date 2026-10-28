import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import {
  FROM_EMAIL,
  REPLY_TO,
  SITE_URL,
  UNSUBSCRIBED,
  button,
  emailLayout,
  resendRequest,
} from "@/lib/email-layout.server";

const CAMPAIGN = "special-referral-5usd-2026-10-28";

// One-time announcement: special $5 referral mission. Secret-guarded, sends once.
export const Route = createFileRoute("/api/public/special-referral-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const provided = request.headers.get("x-announce-secret") ?? "";
        const { data: secretRow } = await supabaseAdmin
          .from("internal_secrets" as never).select("value").eq("name", "referral_announce").maybeSingle();
        const expected = (secretRow as { value?: string } | null)?.value ?? "";
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { data: already } = await supabaseAdmin
          .from("referral_announce_log" as never).select("sent_at").eq("campaign", CAMPAIGN).limit(1).maybeSingle();
        if (already) return Response.json({ sent: false, reason: "already_sent" });

        const { data: members, error } = await supabaseAdmin.from("profiles").select("email").eq("status", "accepted");
        if (error) return new Response(error.message, { status: 500 });
        const emails = [...new Set((members ?? [])
          .map((m) => (m.email ?? "").trim().toLowerCase())
          .filter((e) => e && !UNSUBSCRIBED.has(e)))];
        if (emails.length === 0) return Response.json({ sent: false, reason: "no_recipients" });

        const subject = "Special $5 mission: invite a Reddit user to TaskReddit";
        const html = emailLayout(
          subject,
          `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">A special $5 mission is live</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">This one is simple: invite another Reddit user to join TaskReddit with <strong>your personal referral link</strong>.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
<tr><td style="background:#FFF4EF;border:1px solid #FFD9C7;border-radius:8px;padding:16px;">
<p style="color:#0F172A;font-size:15px;margin:0 0 8px;">1. They sign up through your link</p>
<p style="color:#0F172A;font-size:15px;margin:0 0 8px;">2. Their account gets validated</p>
<p style="color:#0F172A;font-size:15px;margin:0 0 12px;">3. They complete one approved mission</p>
<p style="color:#0F172A;font-size:16px;margin:0 0 6px;">You receive <strong style="color:#FF4500;">$5</strong></p>
<p style="color:#0F172A;font-size:16px;margin:0;">+ <strong style="color:#FF4500;">$0.50</strong> on every task they complete, <strong>for life</strong></p>
</td></tr></table>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">No cap, no expiry. Rewards are paid in crypto (USDC), just like your missions. The more people you bring, the more you earn.</p>
${button(`${SITE_URL}/referrals`, "Get my referral link")}
<p style="color:#64748B;font-size:14px;margin-top:24px;">Your personal link is always on the Referrals page of your dashboard.</p>`,
          `<br>You receive this because you are a verified TaskReddit member.`,
        );
        for (let i = 0; i < emails.length; i += 100) {
          await resendRequest("/emails/batch", emails.slice(i, i + 100).map((to) => ({
            from: FROM_EMAIL, to: [to], reply_to: REPLY_TO, subject, html,
          })));
        }
        await supabaseAdmin.from("referral_announce_log" as never)
          .insert({ recipient_count: emails.length, campaign: CAMPAIGN } as never);
        return Response.json({ sent: true, recipients: emails.length });
      },
    },
  },
});
