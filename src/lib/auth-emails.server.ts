import { z } from "zod";
import { emailLayout, button, resendRequest, AUTH_FROM_EMAIL, REPLY_TO, SITE_URL } from "./email-layout.server";

export const signupInput = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  full_name: z.string().max(100),
  reddit_profile_url: z.string().max(300),
});
export const emailInput = z.object({ email: z.string().email().max(255) });

export function adminAvailable() {
  return Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
}

async function sendAuthMail(to: string, kind: "signup" | "magiclink" | "recovery", tokenHash: string) {
  const url = `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${kind}&next=${encodeURIComponent("/opportunities/comments")}`;
  const isReset = kind === "recovery";
  const subject = isReset ? "Reset your TaskReddit password" : "Confirm your TaskReddit account";
  const content = isReset
    ? `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Reset your password</h1>
       <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Click below to choose a new password for your TaskReddit account.</p>
       ${button(url, "Reset password")}
       <p style="color:#64748B;font-size:14px;margin-top:24px;">If you didn't request this, you can ignore this email.</p>`
    : `<h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Welcome to TaskReddit</h1>
       <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Confirm your email to start earning on Reddit missions.</p>
       ${button(url, "Confirm my email")}
       <p style="color:#64748B;font-size:14px;margin-top:24px;">If the button doesn't work, paste this link:<br>${url}</p>`;
  await resendRequest("/emails", {
    from: AUTH_FROM_EMAIL,
    to: [to],
    reply_to: REPLY_TO,
    subject,
    html: emailLayout(subject, content),
  });
}

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export async function doSignup(data: z.infer<typeof signupInput>): Promise<AuthActionResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = data.email.trim().toLowerCase();
  const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password: data.password,
    options: { data: { full_name: data.full_name, reddit_profile_url: data.reddit_profile_url } },
  });
  if (error) return { ok: false, error: error.message };
  await sendAuthMail(email, "signup", link.properties.hashed_token);
  return { ok: true };
}

export async function doResend(email: string): Promise<AuthActionResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const e = email.trim().toLowerCase();
  const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: e });
  if (!error) await sendAuthMail(e, "magiclink", link.properties.hashed_token);
  return { ok: true };
}

export async function doReset(email: string): Promise<AuthActionResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const e = email.trim().toLowerCase();
  const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: e });
  // Always report success so we don't reveal which emails exist.
  if (!error) await sendAuthMail(e, "recovery", link.properties.hashed_token);
  return { ok: true };
}
