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

        const { UNSUBSCRIBED } = await import("@/lib/email-layout.server");
        type Log = { id: string; sent_at: string; mission_ids: string[] | null; wave2_due_at: string | null; wave2_sent_at: string | null };

        const audience = async (hasSubmitted: boolean) /* false = 0-3 submissions, true = more than 3 */ => {
          const { data: members, error } = await supabaseAdmin.from("profiles").select("id, email").eq("status", "accepted");
          if (error) throw new Error(error.message);
          const { data: subs, error: sErr } = await supabaseAdmin.from("submissions").select("user_id");
          if (sErr) throw new Error(sErr.message);
          const counts = new Map<string, number>();
          for (const s of subs ?? []) counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1);
          return [...new Set((members ?? [])
            .filter((m) => ((counts.get(m.id) ?? 0) > 3) === hasSubmitted)
            .map((m) => (m.email ?? "").trim().toLowerCase())
            .filter((e) => e && !UNSUBSCRIBED.has(e)))];
        };

        const send = async (missions: { subreddit: string; payout: number | string | null }[], emails: string[]) => {
          const total = missions.reduce((s, m) => s + Number(m.payout || 0), 0);
          const subs = [...new Set(missions.map((m) => m.subreddit))].slice(0, 5);
          const html = emailLayout(
            "New missions are available",
            `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">${missions.length} new missions are live</h1>
<p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 12px;">Fresh comment missions were just posted — worth <strong>$${Number.isInteger(total) ? total.toFixed(0) : total.toFixed(2)}</strong> in total.</p>
<p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 24px;">Communities: ${subs.map((s) => `r/${escapeHtml(s.replace(/^r\//, ""))}`).join(", ")}</p>
${button(`${SITE_URL}/opportunities/comments`, "See the missions")}
<p style="color:#64748B;font-size:14px;margin-top:24px;">First come, first served. Remember: stay naturally active on Reddit between tasks.</p>`,
            `<br>You receive this because you are a verified TaskReddit member.`,
          );
          for (let i = 0; i < emails.length; i += 100) {
            await resendRequest("/emails/batch", emails.slice(i, i + 100).map((to) => ({
              from: FROM_EMAIL, to: [to], reply_to: REPLY_TO,
              subject: `${missions.length} new paid missions are available on TaskReddit`, html,
            })));
          }
        };

        // Wave 2: members who already submitted get the alert 12h later, if missions are still open.
        const { data: pending } = await supabaseAdmin
          .from("mission_digest_log" as never)
          .select("id, sent_at, mission_ids, wave2_due_at, wave2_sent_at")
          .lte("wave2_due_at", new Date().toISOString())
          .is("wave2_sent_at", null)
          .order("sent_at", { ascending: true });
        const wave2: Record<string, unknown>[] = [];
        for (const log of (pending ?? []) as Log[]) {
          await supabaseAdmin.from("mission_digest_log" as never)
            .update({ wave2_sent_at: new Date().toISOString(), wave2_recipient_count: 0 } as never).eq("id", log.id);
          // Every mission posted from this wave's start onward (missions added later the same day included).
          const nowIso = new Date().toISOString();
          const from = new Date(new Date(log.sent_at).getTime() - 10 * 60 * 1000).toISOString();
          const { data: open } = await supabaseAdmin.from("missions").select("id, subreddit, payout, reserved_until")
            .gte("created_at", from).eq("is_active", true).eq("is_locked", false);
          const still = (open ?? []).filter((m) => !m.reserved_until || m.reserved_until < nowIso);
          if (still.length === 0) { wave2.push({ id: log.id, sent: false, reason: "all_taken" }); continue; }
          const emails = await audience(true);
          await send(still, emails);
          await supabaseAdmin.from("mission_digest_log" as never)
            .update({ wave2_recipient_count: emails.length } as never).eq("id", log.id);
          wave2.push({ id: log.id, sent: true, recipients: emails.length });
        }

        // Wave 1 (max once per 24h): members who never submitted a mission, right away.
        const { data: lastLog } = await supabaseAdmin
          .from("mission_digest_log" as never)
          .select("sent_at").order("sent_at", { ascending: false }).limit(1).maybeSingle();
        const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const lastSent = (lastLog as { sent_at?: string } | null)?.sent_at;
        if (lastSent && lastSent > dayAgo) {
          return Response.json({ sent: false, reason: "daily_cap", last_sent: lastSent, wave2 });
        }
        const since = lastSent ?? dayAgo;
        const { data: missions, error: mErr } = await supabaseAdmin
          .from("missions").select("id, subreddit, payout")
          .eq("is_active", true).eq("is_locked", false).gt("created_at", since);
        if (mErr) return new Response(mErr.message, { status: 500 });
        if (!missions || missions.length === 0) {
          return Response.json({ sent: false, reason: "no_new_missions", wave2 });
        }
        const emails = await audience(false);
        await send(missions, emails);
        await supabaseAdmin.from("mission_digest_log" as never).insert({
          mission_count: missions.length,
          recipient_count: emails.length,
          mission_ids: missions.map((m) => m.id),
          wave2_due_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        } as never);

        return Response.json({ sent: true, missions: missions.length, recipients: emails.length, wave2 });
      },
    },
  },
});
