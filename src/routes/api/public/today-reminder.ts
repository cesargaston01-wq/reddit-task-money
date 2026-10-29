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

const CAMPAIGN = "today-reminder-2026-10-29";

// One-time reminder to verified members who haven't submitted a task today (UTC). Secret-guarded, sends once.
export const Route = createFileRoute("/api/public/today-reminder")({
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

        const nowIso = new Date().toISOString();
        const { data: open, error: mErr } = await supabaseAdmin
          .from("missions").select("id, reserved_until").eq("is_active", true).eq("is_locked", false);
        if (mErr) return new Response(mErr.message, { status: 500 });
        const available = (open ?? []).filter((m) => !m.reserved_until || m.reserved_until < nowIso).length;
        if (available === 0) return Response.json({ sent: false, reason: "no_missions" });

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const { data: members, error } = await supabaseAdmin.from("profiles").select("id, email").eq("status", "accepted");
        if (error) return new Response(error.message, { status: 500 });
        const { data: subs, error: subErr } = await supabaseAdmin
          .from("submissions").select("user_id").gte("created_at", startOfDay.toISOString());
        if (subErr) return new Response(subErr.message, { status: 500 });
        const submittedToday = new Set((subs ?? []).map((s) => s.user_id));

        const emails = [...new Set((members ?? [])
          .filter((m) => !submittedToday.has(m.id))
          .map((m) => (m.email ?? "").trim().toLowerCase())
          .filter((e) => e && !UNSUBSCRIBED.has(e)))];
        if (emails.length === 0) return Response.json({ sent: false, reason: "no_recipients" });

        const label = available === 1 ? "1 paid mission is" : `${available} paid missions are`;
        const subject = `Reminder: ${label} still available on TaskReddit`;
        const html = emailLayout(
          subject,
          `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">${label} still available</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">You haven't completed a mission today yet — good news, <strong>${label} still open right now</strong>. Grab one before someone else does.</p>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">Each approved contribution is <strong>paid in crypto (USDC)</strong>.</p>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">Remember: write each comment by hand and keep a natural activity on your account between tasks.</p>
${button(`${SITE_URL}/opportunities/comments`, "See the missions")}`,
          `<br>You receive this because you are a verified TaskReddit member.`,
        );
        for (let i = 0; i < emails.length; i += 100) {
          await resendRequest("/emails/batch", emails.slice(i, i + 100).map((to) => ({
            from: FROM_EMAIL, to: [to], reply_to: REPLY_TO, subject, html,
          })));
        }
        await supabaseAdmin.from("referral_announce_log" as never)
          .insert({ recipient_count: emails.length, campaign: CAMPAIGN } as never);
        return Response.json({ sent: true, recipients: emails.length, missions: available });
      },
    },
  },
});
