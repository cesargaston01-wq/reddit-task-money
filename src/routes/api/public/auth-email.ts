import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://reddit-task-money.lovable.app";
const FROM_EMAIL = "TaskReddit <noreply@taskreddit.com>";

export const Route = createFileRoute("/api/public/auth-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-supabase-signature");
        const body = await request.text();

        const secret = process.env["SEND_EMAIL_HOOK_SECRET"];
        if (!secret) {
          console.error("SEND_EMAIL_HOOK_SECRET is not configured");
          return new Response("Hook secret missing", { status: 500 });
        }

        const { createHmac, timingSafeEqual } = await import("crypto");
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        if (!signature || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          return new Response("Invalid signature", { status: 401 });
        }

        const payload = JSON.parse(body) as AuthEmailPayload;
        const html = renderEmail(payload);
        const subject = getSubject(payload.type);

        const resendApiKey = process.env["RESEND_API_KEY"];
        const lovableApiKey = process.env["LOVABLE_API_KEY"];
        if (!resendApiKey || !lovableApiKey) {
          console.error("Missing Resend or Lovable API key");
          return new Response("Email credentials missing", { status: 500 });
        }

        const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
            "X-Connection-Api-Key": resendApiKey,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [payload.email],
            subject,
            html,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Resend send failed:", response.status, errorText);
          return new Response(`Email send failed: ${errorText}`, { status: 502 });
        }

        return new Response("ok");
      },
    },
  },
});

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  email: string;
  type: "signup" | "recovery" | "magiclink" | "invite" | "email_change" | "reauthentication";
  token: string;
  token_hash: string;
  redirect_to: string;
}

function getSubject(type: AuthEmailPayload["type"]) {
  switch (type) {
    case "signup":
      return "Confirm your TaskReddit account";
    case "recovery":
      return "Reset your TaskReddit password";
    case "magiclink":
      return "Sign in to TaskReddit";
    case "invite":
      return "You're invited to TaskReddit";
    case "email_change":
      return "Confirm your new email on TaskReddit";
    case "reauthentication":
      return "Your TaskReddit confirmation code";
    default:
      return "TaskReddit notification";
  }
}

function renderEmail(payload: AuthEmailPayload) {
  const confirmUrl = `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(payload.token_hash)}&type=${payload.type}&next=${encodeURIComponent(payload.redirect_to || SITE_URL)}`;

  let content = "";
  switch (payload.type) {
    case "signup":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Welcome to TaskReddit</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Confirm your email to start earning on Reddit missions.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Confirm my email</a>
        <p style="color:#64748B;font-size:14px;margin-top:24px;">If the button doesn't work, paste this link:<br>${confirmUrl}</p>
      `;
      break;
    case "recovery":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Reset your password</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Click below to choose a new password for your TaskReddit account.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Reset password</a>
      `;
      break;
    case "magiclink":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Sign in to TaskReddit</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Click below to sign in instantly — no password needed.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Sign in</a>
      `;
      break;
    case "invite":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">You're invited to TaskReddit</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Accept your invitation below.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Accept invitation</a>
      `;
      break;
    case "email_change":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Confirm your new email</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Click below to confirm this new email address for your TaskReddit account.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Confirm new email</a>
      `;
      break;
    case "reauthentication":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Confirm it's you</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Use this code to continue:</p>
        <p style="font-size:32px;letter-spacing:4px;font-weight:700;color:#FF4500;margin:0 0 24px;">${payload.token}</p>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${getSubject(payload.type)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" max-width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding:32px;">
                  <div style="margin-bottom:24px;">
                    <span style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#0F172A;">Task<span style="color:#FF4500;">Reddit</span></span>
                  </div>
                  ${content}
                  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">
                    TaskReddit — paid Reddit missions for verified creators.<br>
                    Need help? Reply to this email or contact cesar@skilfut.com.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
