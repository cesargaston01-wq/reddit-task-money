import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createAccountWithResend,
  requestAccountPasswordReset,
  resendAccountConfirmation,
} from "@/lib/auth-email.server";

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("signup"),
    email: z.string(),
    password: z.string(),
    redditProfileUrl: z.string(),
  }),
  z.object({ action: z.literal("resend-confirmation"), email: z.string() }),
  z.object({ action: z.literal("reset-password"), email: z.string() }),
]);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, message: "Invalid request." }, 400);
        }

        const parsed = requestSchema.safeParse(body);
        if (!parsed.success) {
          return json({ ok: false, message: "Please check your details and try again." }, 400);
        }

        if (parsed.data.action === "signup") {
          const result = await createAccountWithResend(parsed.data);
          return json(result, result.ok ? 200 : 400);
        }
        if (parsed.data.action === "resend-confirmation") {
          return json(await resendAccountConfirmation(parsed.data));
        }
        return json(await requestAccountPasswordReset(parsed.data));
      },
    },
  },
});