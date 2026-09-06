const SITE_URL = "https://reddit-task-money.lovable.app";
const FROM_EMAIL = "TaskReddit <noreply@taskreddit.com>";

export type AuthEmailType = "signup" | "magiclink" | "recovery";

function getSubject(type: AuthEmailType) {
  switch (type) {
    case "signup":
      return "Confirm your TaskReddit account";
    case "magiclink":
      return "Sign in to TaskReddit";
    case "recovery":
      return "Reset your TaskReddit password";
  }
}

function renderEmail(type: AuthEmailType, confirmUrl: string) {
  const button = (label: string) =>
    `<a href="${confirmUrl}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a>`;

  let content = "";
  switch (type) {
    case "signup":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Welcome to TaskReddit</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Confirm your email to start earning on Reddit missions.</p>
        ${button("Confirm my email")}`;
      break;
    case "magiclink":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Confirm your email</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Click below to confirm your TaskReddit account.</p>
        ${button("Confirm my email")}`;
      break;
    case "recovery":
      content = `
        <h1 style="color:#0F172A;font-size:24px;margin:0 0 16px;">Reset your password</h1>
        <p style="color:#334155;font-size:16px;line-height:1.5;margin:0 0 24px;">Click below to choose a new password for your TaskReddit account.</p>
        ${button("Reset password")}`;
      break;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${getSubject(type)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;">
        <tr><td style="padding:32px;font-family:Arial,sans-serif;">
          <div style="margin-bottom:24px;"><span style="font-size:20px;font-weight:700;color:#0F172A;">Task<span style="color:#FF4500;">Reddit</span></span></div>
          ${content}
          <p style="color:#64748B;font-size:13px;margin-top:24px;">If the button doesn't work, paste this link into your browser:<br>${confirmUrl}</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">
            TaskReddit — paid Reddit missions for verified creators.<br>
            Need help? Reply to this email or contact cesar@skilfut.com.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAuthEmail(params: {
  type: AuthEmailType;
  email: string;
  tokenHash: string;
  next?: string;
}) {
  const resendApiKey = process.env["RESEND_API_KEY"];
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  if (!resendApiKey || !lovableApiKey) {
    throw new Error("Email service is not configured.");
  }

  const next = params.next ?? `${SITE_URL}/opportunities/posts`;
  const confirmUrl = `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(
    params.tokenHash,
  )}&type=${params.type}&next=${encodeURIComponent(next)}`;

  const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [params.email],
      subject: getSubject(params.type),
      html: renderEmail(params.type, confirmUrl),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend send failed:", response.status, errorText);
    throw new Error("We couldn't send the email. Please try again in a moment.");
  }
}

export { SITE_URL };
