import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

type Ctx = { supabase: unknown; userId: string };

/** Pays ONE approved submission through a Talentir claim link (admin only, manual). */
export const payWithTalentir = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data) => z.object({ submissionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { payOneSubmission } = await import("./talentir.server");
    const ctx = context as Ctx;
    return payOneSubmission(ctx.supabase, ctx.userId, data.submissionId);
  });

/** Refreshes the Talentir status of one submission (admin only). */
export const refreshTalentirStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data) => z.object({ submissionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { refreshOneSubmission } = await import("./talentir.server");
    const ctx = context as Ctx;
    return refreshOneSubmission(ctx.supabase, ctx.userId, data.submissionId);
  });
