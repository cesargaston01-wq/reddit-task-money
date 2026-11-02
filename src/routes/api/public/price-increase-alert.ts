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

const CAMPAIGN = "price-increase-3-50-2026-11-02";

// One-time announcement: comment missions now pay $3.50. Secret-guarded, sends once.
export const Route = createFileRoute("/api/public/price-increase-alert")({
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

        const subject = "Good news: comment missions now pay $3.50";
        const html = emailLayout(
          subject,
          `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Missions now pay more 🎉</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 20px;">Starting today, every approved comment mission on TaskReddit is paid more.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
<tr><td align="center" style="background:#FFF4EF;border:1px solid #FFD9C7;border-radius:8px;padding:20px;">
<p style="color:#64748B;font-size:15px;margin:0 0 6px;text-decoration:line-through;">$3 per comment</p>
<p style="color:#FF4500;font-size:32px;font-weight:700;margin:0;">$3.50 per comment</p>
</td></tr></table>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">Nothing changes on your side: take a mission, write your comment by hand, submit the link, and get paid once it's approved — now <strong>$3.50</strong> each.</p>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">Payouts are still sent by email through Talentir.</p>
${button(`${SITE_URL}/opportunities/comments`, "See available missions")}`,
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
