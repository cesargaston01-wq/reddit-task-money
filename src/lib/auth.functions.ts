import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const signupInput = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  reddit_profile_url: z.string().url().max(255),
  full_name: z.string().min(1).max(120),
});

const emailInput = z.object({ email: z.string().email().max(255) });

/**
 * Creates the account through the admin API (so the built-in mailer stays
 * silent) and delivers the confirmation email through Resend.
 */
export const signupWithResend = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendAuthEmail, SITE_URL } = await import("@/lib/auth-email.server");

    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          reddit_profile_url: data.reddit_profile_url,
        },
        redirectTo: `${SITE_URL}/opportunities/posts`,
      },
    });

    if (error || !linkData?.properties?.hashed_token) {
      return { ok: false as const, message: error?.message ?? "Signup failed." };
    }

    try {
      await sendAuthEmail({
        type: "signup",
        email: data.email,
        tokenHash: linkData.properties.hashed_token,
      });
    } catch (sendError) {
      const userId = linkData.user?.id;
      if (userId) {
        const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (cleanupError) console.error("Failed to roll back signup", cleanupError);
      }
      return {
        ok: false as const,
        message: sendError instanceof Error ? sendError.message : "Email delivery failed.",
      };
    }

    return { ok: true as const };
  });

/** Re-sends the confirmation email for an account that is not confirmed yet. */
export const resendConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendAuthEmail, SITE_URL } = await import("@/lib/auth-email.server");

    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
      options: { redirectTo: `${SITE_URL}/opportunities/posts` },
    });

    if (error || !linkData?.properties?.hashed_token) {
      return { ok: false as const, message: error?.message ?? "Could not send the email." };
    }

    try {
      await sendAuthEmail({
        type: "magiclink",
        email: data.email,
        tokenHash: linkData.properties.hashed_token,
      });
    } catch (sendError) {
      return {
        ok: false as const,
        message: sendError instanceof Error ? sendError.message : "Email delivery failed.",
      };
    }

    return { ok: true as const };
  });

/** Sends the password reset email through Resend. */
export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendAuthEmail, SITE_URL } = await import("@/lib/auth-email.server");

    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: `${SITE_URL}/auth/reset-password` },
    });

    // Never reveal whether the address exists.
    if (error || !linkData?.properties?.hashed_token) {
      return { ok: true as const };
    }

    try {
      await sendAuthEmail({
        type: "recovery",
        email: data.email,
        tokenHash: linkData.properties.hashed_token,
        next: `${SITE_URL}/auth/reset-password`,
      });
    } catch {
      return { ok: true as const };
    }

    return { ok: true as const };
  });
