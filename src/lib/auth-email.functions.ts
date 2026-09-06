import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SITE_URL = "https://reddit-task-money.lovable.app";
const FROM_EMAIL = "TaskReddit <noreply@taskreddit.com>";

const emailSchema = z.string().trim().email().max(255);
const redditProfileSchema = z
  .string()
  .trim()
  .max(255)
  .regex(/^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/);

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(72),
  redditProfileUrl: redditProfileSchema,
});

const emailOnlySchema = z.object({ email: emailSchema });

type EmailKind = "signup" | "recovery";
type ConfirmationType = EmailKind | "magiclink";

function confirmationUrl(tokenHash: string, type: ConfirmationType, next: string) {
  const params = new URLSearchParams({ token_hash: tokenHash, type, next });
  return `${SITE_URL}/auth/confirm?${params.toString()}`;
}

function emailContent(kind: EmailKind, actionUrl: string) {
  if (kind === "recovery") {
    return {
      subject: "Reset your TaskReddit password",
      heading: "Reset your password",
      copy: "Click below to choose a new password for your TaskReddit account.",
      button: "Reset password",
      actionUrl,
    };
  }

  return {
    subject: "Confirm your TaskReddit account",
    heading: "Welcome to TaskReddit",
    copy: "Confirm your email to start earning on Reddit missions.",
    button: "Confirm my email",
    actionUrl,
  };
}

function renderEmail(kind: EmailKind, actionUrl: string) {
  const content = emailContent(kind, actionUrl);
  return {
    subject: content.subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${content.subject}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        <tr><td style="padding:32px;">
          <div style="margin-bottom:24px;font-size:20px;font-weight:700;color:#0f172a;">Task<span style="color:#ff4500;">Reddit</span></div>
          <h1 style="color:#0f172a;font-size:24px;margin:0 0 16px;">${content.heading}</h1>
          <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">${content.copy}</p>
          <a href="${content.actionUrl}" style="display:inline-block;background:#ff4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${content.button}</a>
          <p style="color:#64748b;font-size:14px;line-height:1.5;margin-top:24px;word-break:break-all;">If the button does not work, paste this link into your browser:<br>${content.actionUrl}</p>
          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">TaskReddit — paid Reddit missions for verified creators.<br>Need help? Contact cesar@skilfut.com.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

async function sendWithResend(to: string, kind: EmailKind, actionUrl: string) {
  const resendApiKey = process.env["RESEND_API_KEY"];
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  if (!resendApiKey || !lovableApiKey) {
    console.error("Resend connection is not configured");
    return false;
  }

  const email = renderEmail(kind, actionUrl);
  const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: email.subject, html: email.html }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend request failed [${response.status}]: ${body}`);
    return false;
  }

  return true;
}

async function accountExistsAndNeedsConfirmation(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  email: string,
) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Account lookup failed:", error.message);
      return false;
    }

    const account = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (account) return !account.email_confirmed_at;
    if (data.users.length < 1000) return false;
  }

  return false;
}

export const signUpWithResend = createServerFn({ method: "POST" })
  .inputValidator((input) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const redditUsername =
        data.redditProfileUrl.replace(/\/+$/, "").split("/").pop() ?? "Reddit user";
      const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: redditUsername,
            reddit_profile_url: data.redditProfileUrl,
          },
          redirectTo: `${SITE_URL}/opportunities/posts`,
        },
      });

      if (error) {
        console.error("Signup link generation failed:", error.message);
        const message = error.message.toLowerCase();
        if (message.includes("already") || message.includes("registered")) {
          return {
            ok: false,
            message: "An account already exists with this email. Try signing in instead.",
          };
        }
        return { ok: false, message: "We could not create your account. Please try again." };
      }

      if (!linkData.properties.hashed_token) {
        console.error("Signup link generation failed: missing token");
        return { ok: false, message: "We could not create your account. Please try again." };
      }

      const actionUrl = confirmationUrl(
        linkData.properties.hashed_token,
        "signup",
        "/opportunities/posts",
      );
      const sent = await sendWithResend(data.email, "signup", actionUrl);
      if (!sent) {
        return {
          ok: false,
          message: "We could not send the confirmation email. Please try again.",
        };
      }
      return { ok: true };
    } catch (err) {
      console.error("Signup failed:", err instanceof Error ? err.message : String(err));
      return { ok: false, message: "We could not create your account. Please try again." };
    }
  });

export const resendConfirmationWithResend = createServerFn({ method: "POST" })
  .inputValidator((input) => emailOnlySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await accountExistsAndNeedsConfirmation(supabaseAdmin, data.email))) {
      return { ok: true };
    }

    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
      options: { redirectTo: `${SITE_URL}/opportunities/posts` },
    });

    if (error || !linkData.properties.hashed_token) {
      console.error("Confirmation link generation failed:", error?.message ?? "missing token");
      return { ok: true };
    }

    const actionUrl = confirmationUrl(
      linkData.properties.hashed_token,
      "magiclink",
      "/opportunities/posts",
    );
    await sendWithResend(data.email, "signup", actionUrl);
    return { ok: true };
  });

export const requestPasswordResetWithResend = createServerFn({ method: "POST" })
  .inputValidator((input) => emailOnlySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo: `${SITE_URL}/auth/reset-password` },
    });

    if (error || !linkData.properties.hashed_token) {
      console.error("Recovery link generation failed:", error?.message ?? "missing token");
      return { ok: true };
    }

    const actionUrl = confirmationUrl(
      linkData.properties.hashed_token,
      "recovery",
      "/auth/reset-password",
    );
    await sendWithResend(data.email, "recovery", actionUrl);
    return { ok: true };
  });
