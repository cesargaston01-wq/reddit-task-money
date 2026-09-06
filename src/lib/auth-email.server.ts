import { z } from "zod";

const SITE_URL = "https://reddit-task-money.lovable.app";
const FROM_EMAIL = "TaskReddit <noreply@taskreddit.com>";

const emailSchema = z.string().trim().email().max(255);
export function extractRedditUsername(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  value = value.split(/[?#]/)[0] ?? value;
  value = value.replace(/^https?:\/\//i, "").replace(/^[a-z0-9-]+\.reddit\.com/i, "reddit.com");
  value = value.replace(/^reddit\.com/i, "");
  value = value.replace(/^\/+/, "");
  value = value.replace(/^(user|u)\//i, "");
  value = value.replace(/^@/, "");
  value = value.replace(/\/.*$/, "").trim();
  return /^[A-Za-z0-9_-]{3,20}$/.test(value) ? value : null;
}

function normalizeRedditProfile(value: unknown) {
  if (typeof value !== "string") return value;
  const username = extractRedditUsername(value);
  return username ? `https://reddit.com/user/${username}` : value.trim();
}

const redditProfileSchema = z
  .string()
  .trim()
  .max(255)
  .regex(/^https?:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/);

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(72),
  redditProfileUrl: z.preprocess(normalizeRedditProfile, redditProfileSchema),
});

const emailOnlySchema = z.object({ email: emailSchema });

type EmailKind = "signup" | "recovery";
type ConfirmationType = EmailKind | "magiclink";
type SendResult = { ok: true } | { ok: false; reason: "configuration" | "provider" };

function signupErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("password")) {
    return "This password was refused for security reasons. Use a unique 12–72 character phrase that you have never used elsewhere.";
  }
  if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
    return "An account already exists with this email. Try signing in instead.";
  }
  return "We could not create your account. Please try again.";
}

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
    return { ok: false, reason: "configuration" } satisfies SendResult;
  }

  try {
    const email = renderEmail(kind, actionUrl);
    const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: email.subject,
        html: email.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Resend request failed [${response.status}]: ${body}`);
      return { ok: false, reason: "provider" } satisfies SendResult;
    }
  } catch (error) {
    console.error(
      "Resend request failed before receiving a response:",
      error instanceof Error ? error.message : String(error),
    );
    return { ok: false, reason: "provider" } satisfies SendResult;
  }

  return { ok: true } satisfies SendResult;
}

async function findAccountByEmail(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  email: string,
) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const account = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (account) return account;
    if (data.users.length < 1000) return null;
  }

  return null;
}

export type AuthEmailResult = { ok: true } | { ok: false; message: string };

export async function createAccountWithResend(input: unknown): Promise<AuthEmailResult> {
  const parsedInput = signupSchema.safeParse(input);
  if (!parsedInput.success) {
    const issue = parsedInput.error.issues[0];
    const field = issue?.path[0];
    const message =
      field === "email"
        ? "Enter a valid email address."
        : field === "password"
          ? "Use a password between 12 and 72 characters."
          : field === "redditProfileUrl"
            ? "Enter a valid Reddit profile link or @username."
            : "Please check your signup details and try again.";
    return { ok: false, message };
  }

  const data = parsedInput.data;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existingAccount = await findAccountByEmail(supabaseAdmin, data.email);
    if (existingAccount?.email_confirmed_at) {
      return {
        ok: false,
        message: "An account already exists with this email. Try signing in instead.",
      };
    }

    // A previous email-delivery failure can leave an unusable, unconfirmed account behind.
    // Remove it before retrying so the user can complete signup normally.
    if (existingAccount) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAccount.id);
      if (deleteError) {
        console.error("Unconfirmed account cleanup failed:", deleteError.message);
        return { ok: false, message: "We could not restart your signup. Please try again." };
      }
    }

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
      return { ok: false, message: signupErrorMessage(error) };
    }

    if (!linkData.properties.hashed_token) {
      console.error("Signup link generation failed: missing token");
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(linkData.user.id);
      if (rollbackError) {
        console.error("Missing-token signup cleanup failed:", rollbackError.message);
      }
      return { ok: false, message: "We could not create your account. Please try again." };
    }

    const actionUrl = confirmationUrl(
      linkData.properties.hashed_token,
      "signup",
      "/opportunities/posts",
    );
    const sent = await sendWithResend(data.email, "signup", actionUrl);
    if (!sent.ok) {
      const createdUserId = linkData.user.id;
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      if (rollbackError) {
        console.error("Failed signup cleanup failed:", rollbackError.message);
      }
      return {
        ok: false,
        message:
          sent.reason === "configuration"
            ? "Email delivery is temporarily unavailable. Please try again shortly."
            : "Resend could not deliver the confirmation email. Check the address and try again.",
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("Signup failed:", err instanceof Error ? err.message : String(err));
    return { ok: false, message: signupErrorMessage(err) };
  }
}

export async function resendAccountConfirmation(input: unknown): Promise<AuthEmailResult> {
  const parsedInput = emailOnlySchema.safeParse(input);
  if (!parsedInput.success) return { ok: true };
  const data = parsedInput.data;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const account = await findAccountByEmail(supabaseAdmin, data.email);
    if (!account || account.email_confirmed_at) {
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
    const sent = await sendWithResend(data.email, "signup", actionUrl);
    if (!sent.ok) console.error("Confirmation email delivery failed:", sent.reason);
    return { ok: true };
  } catch (error) {
    console.error(
      "Confirmation request failed:",
      error instanceof Error ? error.message : String(error),
    );
    return { ok: true };
  }
}

export async function requestAccountPasswordReset(input: unknown): Promise<AuthEmailResult> {
  const parsedInput = emailOnlySchema.safeParse(input);
  if (!parsedInput.success) return { ok: true };
  const data = parsedInput.data;
  try {
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
    const sent = await sendWithResend(data.email, "recovery", actionUrl);
    if (!sent.ok) console.error("Recovery email delivery failed:", sent.reason);
    return { ok: true };
  } catch (error) {
    console.error(
      "Recovery request failed:",
      error instanceof Error ? error.message : String(error),
    );
    return { ok: true };
  }
}
