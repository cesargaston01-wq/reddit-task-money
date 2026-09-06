import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const signupInput = z.object({
  action: z.literal("signup"),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  reddit_profile_url: z.string().url().max(255),
  full_name: z.string().min(1).max(120),
});

const emailInput = z.object({
  action: z.enum(["resend", "recovery"]),
  email: z.string().email().max(255),
});

const inputSchema = z.discriminatedUnion("action", [signupInput, emailInput]);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/auth-actions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: z.infer<typeof inputSchema>;
        try {
          input = inputSchema.parse(await request.json());
        } catch {
          return json({ ok: false, message: "Invalid account information." }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendAuthEmail, SITE_URL } = await import("@/lib/auth-email.server");

        if (input.action === "signup") {
          const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email: input.email,
            password: input.password,
            options: {
              data: {
                full_name: input.full_name,
                reddit_profile_url: input.reddit_profile_url,
              },
              redirectTo: `${SITE_URL}/opportunities/posts`,
            },
          });

          if (error || !linkData?.properties?.hashed_token) {
            return json({ ok: false, message: error?.message ?? "Signup failed." }, 400);
          }

          try {
            await sendAuthEmail({
              type: "signup",
              email: input.email,
              tokenHash: linkData.properties.hashed_token,
            });
          } catch (error) {
            console.error("Signup email delivery failed", error);
            const userId = linkData.user?.id;
            if (userId) {
              const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(userId);
              if (cleanupError) console.error("Failed to roll back signup", cleanupError);
            }
            return json(
              { ok: false, message: "We couldn't send the email. Please try again in a moment." },
              502,
            );
          }

          return json({ ok: true });
        }

        const type = input.action === "recovery" ? "recovery" : "magiclink";
        const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
          type,
          email: input.email,
          options: {
            redirectTo:
              type === "recovery"
                ? `${SITE_URL}/auth/reset-password`
                : `${SITE_URL}/opportunities/posts`,
          },
        });

        if (input.action === "recovery" && (error || !linkData?.properties?.hashed_token)) {
          return json({ ok: true });
        }
        if (error || !linkData?.properties?.hashed_token) {
          return json({ ok: false, message: error?.message ?? "Could not send the email." }, 400);
        }

        try {
          await sendAuthEmail({
            type,
            email: input.email,
            tokenHash: linkData.properties.hashed_token,
            next: type === "recovery" ? `${SITE_URL}/auth/reset-password` : undefined,
          });
        } catch (sendError) {
          console.error("Auth email delivery failed", sendError);
          if (input.action === "recovery") return json({ ok: true });
          return json(
            { ok: false, message: "We couldn't send the email. Please try again in a moment." },
            502,
          );
        }

        return json({ ok: true });
      },
    },
  },
});
