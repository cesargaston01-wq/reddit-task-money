import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Used by the editor preview, whose server has no Talentir key: the admin's browser sends the
// payment request here (live site), with the admin's own sign-in token. The handler checks the
// token and the admin role before touching Talentir, exactly like the server functions do.
// Any origin may call it: access depends only on the bearer token in the Authorization header
// (never on cookies), so an allowed origin grants nothing by itself.
function corsFor(_origin: string | null) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
  };
}

const body = z.object({
  action: z.enum(["pay", "refresh"]),
  submissionId: z.string().uuid(),
});

export const Route = createFileRoute("/api/public/talentir-action")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: corsFor(request.headers.get("origin")) }),
      POST: async ({ request }) => {
        const headers = corsFor(request.headers.get("origin"));
        const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ ok: false, error: "Invalid request" }, 400);

        let ctx;
        try {
          const { userClientFromAuthHeader } = await import("@/lib/supabase-token-client.server");
          ctx = await userClientFromAuthHeader(request.headers.get("authorization"));
        } catch (e) {
          return json({ ok: false, error: e instanceof Error ? e.message : "Unauthorized" }, 401);
        }

        try {
          const t = await import("@/lib/talentir.server");
          if (!t.talentirConfigured()) return json({ ok: false, error: "Talentir is not connected." }, 503);
          const r =
            parsed.data.action === "pay"
              ? await t.payOneSubmission(ctx.supabase, ctx.userId, parsed.data.submissionId)
              : await t.refreshOneSubmission(ctx.supabase, ctx.userId, parsed.data.submissionId);
          return json({ ok: true, ...r });
        } catch (e) {
          console.error("talentir-action failed", e);
          return json({ ok: false, error: e instanceof Error ? e.message : "Talentir request failed." }, 400);
        }
      },
    },
  },
});
