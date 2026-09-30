import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Used by the editor preview (which has no backend admin credentials) so that
// sign-up / confirmation / reset emails always go out through Resend from the live site.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("signup"),
    email: z.string().email().max(255),
    password: z.string().min(6).max(72),
    full_name: z.string().max(100),
    reddit_profile_url: z.string().max(300),
    referral_code: z.string().max(32).optional(),
  }),
  z.object({ action: z.literal("resend"), email: z.string().email().max(255) }),
  z.object({ action: z.literal("reset"), email: z.string().email().max(255) }),
]);

export const Route = createFileRoute("/api/public/auth-action")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const json = (data: unknown, status = 200) =>
          Response.json(data, { status, headers: cors });
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ ok: false, error: "Invalid request" }, 400);
        const m = await import("@/lib/auth-emails.server");
        if (!m.adminAvailable()) return json({ ok: false, error: "Email service unavailable" }, 503);
        try {
          const d = parsed.data;
          const r =
            d.action === "signup"
              ? await m.doSignup(d)
              : d.action === "resend"
                ? await m.doResend(d.email)
                : await m.doReset(d.email);
          return json(r);
        } catch (err) {
          console.error("auth-action failed", err);
          return json({ ok: false, error: "Could not send the email. Try again." }, 500);
        }
      },
    },
  },
});
