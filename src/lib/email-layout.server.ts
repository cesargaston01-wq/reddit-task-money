export const SITE_URL = "https://reddit-task-money.lovable.app";
export const FROM_EMAIL = "TaskReddit <contact@taskreddit.com>";
export const AUTH_FROM_EMAIL = "TaskReddit <noreply@taskreddit.com>";
export const REPLY_TO = "contact@taskreddit.com";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#FF4500;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-family:Arial,sans-serif;">${label}</a>`;
}

export function emailLayout(title: string, content: string, footerNote = "") {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
<tr><td style="padding:32px;">
<div style="margin-bottom:24px;"><span style="font-size:20px;font-weight:700;color:#0F172A;">Task<span style="color:#FF4500;">Reddit</span></span></div>
${content}
<p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">
TaskReddit — paid Reddit missions for verified creators.<br>
Questions? Reply to this email or write to <a href="mailto:${REPLY_TO}" style="color:#FF4500;">${REPLY_TO}</a>.${footerNote}
</p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function resendRequest(path: "/emails" | "/emails/batch", body: unknown) {
  const resendApiKey = process.env["RESEND_API_KEY"];
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  if (!resendApiKey || !lovableApiKey) throw new Error("Missing Resend or Lovable API key");
  const response = await fetch(`https://connector-gateway.lovable.dev/resend${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed [${response.status}]: ${text}`);
  }
  return response.json();
}
