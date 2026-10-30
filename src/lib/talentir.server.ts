// Server-only Talentir helpers. Calls go through the Lovable connector gateway.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_talentir";

export type TalentirPayout = {
  id: string;
  customId: string | null;
  status: string;
  amount: string;
  currency: string;
  claimLinkSentAt: string | null;
  failureReason: string | null;
};

export class TalentirError extends Error {
  constructor(
    public status: number,
    public code: string | null,
    message: string,
  ) {
    super(message);
  }
}

async function talentirFetch(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["UDC_TALENTIR_API_KEY"];
  if (!lovableKey || !connKey) throw new Error("Talentir is not connected.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${lovableKey}`);
  headers.set("X-Connection-Api-Key", connKey);
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.idempotencyKey) headers.set("Idempotency-Key", init.idempotencyKey);

  const res = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Talentir request failed [${res.status}] ${path}: ${text}`);
    let code: string | null = null;
    let message = text;
    try {
      const j = JSON.parse(text) as { code?: string; message?: string; error?: { code?: string; message?: string } };
      code = j.code ?? j.error?.code ?? null;
      message = j.message ?? j.error?.message ?? text;
    } catch {
      /* keep raw text */
    }
    throw new TalentirError(res.status, code, `Talentir [${res.status}${code ? ` ${code}` : ""}]: ${message}`);
  }
  return JSON.parse(text) as TalentirPayout;
}

/** Creates, approves and emails a claim-link payout in one atomic request. */
export async function createClaimLinkPayout(input: {
  customId: string;
  email: string;
  amount: number;
  description: string;
}) {
  return talentirFetch("/payouts", {
    method: "POST",
    idempotencyKey: input.customId,
    body: JSON.stringify({
      customId: input.customId,
      description: input.description,
      amount: input.amount.toFixed(2),
      currency: "USD",
      recipient: { type: "email", email: input.email },
      tags: ["taskreddit"],
      andThen: "approve_and_send_claim_link",
    }),
  });
}

export async function getPayout(idOrCustomId: string) {
  return talentirFetch(`/payouts/${encodeURIComponent(idOrCustomId)}`, { method: "GET" });
}
