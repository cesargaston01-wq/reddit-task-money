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

// Called by the database when an admin rejects a submission.
// Tells the member once per submission that the comment was not visible on Reddit.
const body = z.object({ submission_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/submission-rejected")({
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
        const submissionId = parsed.data.submission_id;

        const { data: sub } = await supabaseAdmin
          .from("submissions")
          .select("user_id, status, submitted_url, missions(title, subreddit)")
          .eq("id", submissionId)
          .maybeSingle();
        if (!sub || sub.status !== "rejected") {
          return Response.json({ sent: false, reason: "not_rejected" });
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", sub.user_id)
          .maybeSingle();
        if (!profile?.email) return Response.json({ sent: false, reason: "no_email" });

        const { error: logErr } = await supabaseAdmin
          .from("submission_rejection_email_log" as never)
          .insert({ submission_id: submissionId } as never);
        if (logErr) return Response.json({ sent: false, reason: "already_sent" });

        const mission = (sub as { missions?: { title?: string; subreddit?: string } | null }).missions;
        const name = profile.full_name ? escapeHtml(profile.full_name) : "";
        const missionLabel = mission?.title
          ? escapeHtml(mission.title) + (mission.subreddit ? ` (r/${escapeHtml(mission.subreddit)})` : "")
          : "your mission";
        const link = sub.submitted_url ? escapeHtml(sub.submitted_url) : "";
        const subject = "Your TaskReddit submission was rejected";
        const content = `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Submission rejected${name ? `, ${name}` : ""}</h1>
          <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;">We reviewed your submission for <strong>${missionLabel}</strong> and unfortunately had to reject it.</p>
          <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 16px;"><strong>Reason:</strong> your comment is not visible on Reddit — it was removed or hidden by Reddit (or the subreddit's moderators), so it cannot be approved.</p>
          ${link ? `<p style="color:#64748B;font-size:14px;line-height:1.5;margin:0 0 16px;">Submitted link: <a href="${link}" style="color:#FF4500;">${link}</a></p>` : ""}
          <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">To avoid this next time: keep a natural activity on your Reddit account between missions, write the comment by hand, and check it is still visible when logged out before submitting.</p>
          ${button(`${SITE_URL}/opportunities/comments`, "See other missions")}`;

        try {
          await resendRequest("/emails", {
            from: FROM_EMAIL,
            to: [profile.email],
            reply_to: REPLY_TO,
            subject,
            html: emailLayout(subject, content),
          });
        } catch (err) {
          console.error("submission-rejected email failed", err);
          await supabaseAdmin
            .from("submission_rejection_email_log" as never)
            .delete()
            .eq("submission_id", submissionId);
          return Response.json({ sent: false, reason: "send_failed" }, { status: 500 });
        }

        return Response.json({ sent: true });
      },
    },
  },
});
