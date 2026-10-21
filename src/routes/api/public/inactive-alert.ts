import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { FROM_EMAIL, REPLY_TO, SITE_URL, button, emailLayout, resendRequest } from "@/lib/email-layout.server";

const CAMPAIGN = "inactive-alert-2026-10-21";

// One-time alert to verified members who never submitted a task. Secret-guarded, sends once.
export const Route = createFileRoute("/api/public/inactive-alert")({
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

        const { data: members, error } = await supabaseAdmin.from("profiles").select("id, email").eq("status", "accepted");
        if (error) return new Response(error.message, { status: 500 });
        const { data: subs, error: subErr } = await supabaseAdmin.from("submissions").select("user_id");
        if (subErr) return new Response(subErr.message, { status: 500 });
        const submitted = new Set((subs ?? []).map((s) => s.user_id));

        const emails = [...new Set((members ?? [])
          .filter((m) => !submitted.has(m.id))
          .map((m) => (m.email ?? "").trim().toLowerCase())
          .filter(Boolean))];
        if (emails.length === 0) return Response.json({ sent: false, reason: "no_recipients" });

        const subject = "A paid mission is still waiting for you on TaskReddit";
        const html = emailLayout(
          subject,
          `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">A mission is still available for you</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">Your TaskReddit account is verified, but you haven't completed your first mission yet. Good news: <strong>a mission is still available right now</strong> — grab it and start earning.</p>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">Each approved contribution is <strong>paid in crypto (USDC)</strong>. Missions go fast, so don't wait too long.</p>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">Remember: write each comment by hand and keep a natural activity on your account between tasks.</p>
${button(`${SITE_URL}/opportunities/comments`, "Start my first mission")}`,
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
