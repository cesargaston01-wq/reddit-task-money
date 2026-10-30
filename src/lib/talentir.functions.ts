import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data: role, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!role) throw new Error("Admins only.");
}

/** Pays ONE approved submission through a Talentir claim link (admin only, manual). */
export const payWithTalentir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ submissionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { createClaimLinkPayout, getPayout, TalentirError } = await import("./talentir.server");

    const { data: sub, error } = await context.supabase
      .from("submissions")
      .select("id, user_id, amount, status, paid, talentir_payout_id, missions(title)")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("Submission not found.");
    if (sub.status !== "approved") throw new Error("Approve the submission before paying it.");
    if (sub.paid || sub.talentir_payout_id) throw new Error("This submission is already paid.");

    const { data: profile, error: pErr } = await context.supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", sub.user_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    const email = profile?.email?.trim();
    if (!email) throw new Error("This member has no email address.");

    const amount = Number(sub.amount);
    if (!(amount >= 0.1)) throw new Error("Amount must be at least $0.10.");

    const customId = `taskreddit-sub-${sub.id}`;
    const title = (sub.missions as { title?: string } | null)?.title ?? "Reddit mission";

    let payout;
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

    const { error: uErr } = await context.supabase
      .from("submissions")
      .update({
        paid: true,
        talentir_payout_id: payout.id,
        talentir_status: payout.status,
        talentir_sent_at: payout.claimLinkSentAt ?? new Date().toISOString(),
      })
      .eq("id", sub.id);
    if (uErr) throw new Error(uErr.message);

    return { ok: true, status: payout.status, email };
  });

/** Refreshes the Talentir status of one submission (admin only). */
export const refreshTalentirStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ submissionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx);
    const { getPayout } = await import("./talentir.server");
    const { data: sub, error } = await context.supabase
      .from("submissions")
      .select("id, talentir_payout_id")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub?.talentir_payout_id) throw new Error("No Talentir payment for this submission.");
    const payout = await getPayout(sub.talentir_payout_id);
    const { error: uErr } = await context.supabase
      .from("submissions")
      .update({ talentir_status: payout.status })
      .eq("id", sub.id);
    if (uErr) throw new Error(uErr.message);
    return { status: payout.status };
  });
