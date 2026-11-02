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

// ---- Shared payment logic (used by the server functions and by the live-site endpoint) ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserClient = any;

export async function assertAdmin(supabase: UserClient, userId: string) {
  const { data: role, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!role) throw new Error("Admins only.");
}

export function talentirConfigured() {
  return Boolean(process.env["LOVABLE_API_KEY"] && process.env["UDC_TALENTIR_API_KEY"]);
}

/** Pays ONE approved submission through a Talentir claim link. Caller must be admin. */
export async function payOneSubmission(supabase: UserClient, userId: string, submissionId: string) {
  await assertAdmin(supabase, userId);

  const { data: sub, error } = await supabase
    .from("submissions")
    .select("id, user_id, amount, status, paid, talentir_payout_id, missions(title)")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!sub) throw new Error("Submission not found.");
  if (sub.status !== "approved") throw new Error("Approve the submission before paying it.");
  if (sub.paid || sub.talentir_payout_id) throw new Error("This submission is already paid.");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", sub.user_id)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  const email = (profile?.email as string | undefined)?.trim();
  if (!email) throw new Error("This member has no email address.");

  const amount = Number(sub.amount);
  if (!(amount >= 0.1)) throw new Error("Amount must be at least $0.10.");

  const customId = `taskreddit-sub-${sub.id}`;
  const title = (sub.missions as { title?: string } | null)?.title ?? "Reddit mission";

  let payout: TalentirPayout;
  try {
    payout = await createClaimLinkPayout({
      customId,
      email,
      amount,
      description: `TaskReddit payment for your approved mission: ${title}`,
    });
  } catch (e) {
    // Already created earlier (e.g. the page was closed mid-request): reconcile instead of paying twice.
    if (e instanceof TalentirError && e.code === "CUSTOM_ID_TAKEN") {
      payout = await getPayout(customId);
    } else {
      throw e;
    }
  }

  const { error: uErr } = await supabase
    .from("submissions")
    .update({
      paid: true,
      talentir_payout_id: payout.id,
      talentir_status: payout.status,
      talentir_sent_at: payout.claimLinkSentAt ?? new Date().toISOString(),
    })
    .eq("id", sub.id);
  if (uErr) throw new Error(uErr.message);

  return { ok: true as const, status: payout.status, email };
}

/** Refreshes the Talentir status of one submission. Caller must be admin. */
export async function refreshOneSubmission(supabase: UserClient, userId: string, submissionId: string) {
  await assertAdmin(supabase, userId);
  const { data: sub, error } = await supabase
    .from("submissions")
    .select("id, talentir_payout_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!sub?.talentir_payout_id) throw new Error("No Talentir payment for this submission.");
  const payout = await getPayout(sub.talentir_payout_id);
  const { error: uErr } = await supabase
    .from("submissions")
    .update({ talentir_status: payout.status })
    .eq("id", sub.id);
  if (uErr) throw new Error(uErr.message);
  return { status: payout.status };
}
