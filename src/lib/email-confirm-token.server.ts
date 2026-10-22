// Stateless signed links that confirm an email address directly.
// They don't invalidate each other, so any confirmation email the user clicks keeps working.
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function hmac(data: string): Promise<string> {
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!secret) throw new Error("Signing key unavailable");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`email-confirm:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createConfirmParams(userId: string, now = Date.now()) {
  const exp = String(now + TTL_MS);
  const sig = await hmac(`${userId}.${exp}`);
  return new URLSearchParams({ uid: userId, exp, sig }).toString();
}

export async function verifyConfirmParams(uid: string, exp: string, sig: string, now = Date.now()) {
  if (!/^[0-9a-f-]{36}$/i.test(uid) || !/^\d+$/.test(exp) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  if (Number(exp) < now) return false;
  const expected = await hmac(`${uid}.${exp}`);
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
