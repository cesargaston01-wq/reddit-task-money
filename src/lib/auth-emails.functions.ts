import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Result: `fallback: true` means this environment (e.g. the editor preview) has no
// backend admin credentials — the browser then asks the live site to send the
// Resend email instead.
type Result = { ok: true } | { ok: false; fallback: boolean; error: string };

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  full_name: z.string().max(100),
  reddit_profile_url: z.string().max(300),
    referral_code: z.string().max(32).optional(),
});
const emailSchema = z.object({ email: z.string().email().max(255) });

export const signUpWithResend = createServerFn({ method: "POST" })
  .inputValidator((d) => signupSchema.parse(d))
  .handler(async ({ data }): Promise<Result> => {
    const m = await import("./auth-emails.server");
    if (!m.adminAvailable()) return { ok: false, fallback: true, error: "" };
    const r = await m.doSignup(data);
    return r.ok ? r : { ok: false, fallback: false, error: r.error };
  });

export const resendConfirmationWithResend = createServerFn({ method: "POST" })
  .inputValidator((d) => emailSchema.parse(d))
  .handler(async ({ data }): Promise<Result> => {
    const m = await import("./auth-emails.server");
    if (!m.adminAvailable()) return { ok: false, fallback: true, error: "" };
    return m.doResend(data.email) as Promise<Result>;
  });

export const resetPasswordWithResend = createServerFn({ method: "POST" })
  .inputValidator((d) => emailSchema.parse(d))
  .handler(async ({ data }): Promise<Result> => {
    const m = await import("./auth-emails.server");
    if (!m.adminAvailable()) return { ok: false, fallback: true, error: "" };
    return m.doReset(data.email) as Promise<Result>;
  });
