import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import {
  FROM_EMAIL,
  REPLY_TO,
  SITE_URL,
  button,
  emailLayout,
  escapeHtml,
  resendRequest,
} from "@/lib/email-layout.server";

export const Route = createFileRoute("/api/public/mission-digest")({
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

        // Max one alert per 24h: skip if a digest went out less than a day ago.
        const { data: lastLog } = await supabaseAdmin
          .from("mission_digest_log" as never)
          .select("sent_at")
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const lastSent = (lastLog as { sent_at?: string } | null)?.sent_at;
        if (lastSent && lastSent > dayAgo) {
          return Response.json({ sent: false, reason: "daily_cap", last_sent: lastSent });
        }
        const since = lastSent ?? dayAgo;

        // Any new open mission since the last alert triggers the email.
        const { data: missions, error: mErr } = await supabaseAdmin
          .from("missions")
          .select("id, subreddit, payout")
          .eq("is_active", true)
          .eq("is_locked", false)
          .gt("created_at", since);
        if (mErr) return new Response(mErr.message, { status: 500 });
        if (!missions || missions.length === 0) {
          return Response.json({ sent: false, reason: "no_new_missions" });
        }

        const { data: members, error: pErr } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("status", "accepted");
        if (pErr) return new Response(pErr.message, { status: 500 });
        const emails = (members ?? []).map((m) => m.email).filter(Boolean);

        const total = missions.reduce((s, m) => s + Number(m.payout || 0), 0);
        const subs = [...new Set(missions.map((m) => m.subreddit))].slice(0, 5);
        const html = emailLayout(
          "New missions are available",
          `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">${missions.length} new missions are live</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 12px;">Fresh comment missions were just posted — worth <strong>$${total.toFixed(0)}</strong> in total.</p>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">Communities: ${subs.map((s) => `r/${escapeHtml(s.replace(/^r\//, ""))}`).join(", ")}</p>
${button(`${SITE_URL}/opportunities/comments`, "See the missions")}
<p style="color:#64748B;font-size:14px;margin-top:24px;">First come, first served. Remember: stay naturally active on Reddit between tasks.</p>`,
          `<br>You receive this because you are a verified TaskReddit member.`,
        );

        // Individual emails, sent in batches of 100.
        for (let i = 0; i < emails.length; i += 100) {
          const chunk = emails.slice(i, i + 100).map((to) => ({
            from: FROM_EMAIL,
            to: [to],
            reply_to: REPLY_TO,
            subject: `${missions.length} new paid missions are available on TaskReddit`,
            html,
          }));
          await resendRequest("/emails/batch", chunk);
        }

        await supabaseAdmin
          .from("mission_digest_log" as never)
          .insert({ mission_count: missions.length, recipient_count: emails.length } as never);

        return Response.json({ sent: true, missions: missions.length, recipients: emails.length });
      },
    },
  },
});
