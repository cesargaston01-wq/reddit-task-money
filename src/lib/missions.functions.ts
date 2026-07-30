import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const RESERVATION_MINUTES = 10;

/** Reserve a mission for the current worker for 10 minutes. */
export const reserveMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { missionId: string }) => {
    if (!input?.missionId || typeof input.missionId !== "string") {
      throw new Error("Invalid mission");
    }
    return { missionId: input.missionId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (profile?.status !== "accepted") {
      throw new Error("Your account must be verified before taking a mission.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const until = new Date(now.getTime() + RESERVATION_MINUTES * 60_000).toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from("missions")
      .update({ reserved_by: userId, reserved_until: until })
      .eq("id", data.missionId)
      .eq("is_active", true)
      .eq("is_locked", false)
      .or(`reserved_until.is.null,reserved_until.lt.${now.toISOString()},reserved_by.eq.${userId}`)
      .select("id, reserved_until")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("This mission was just reserved by another member.");
    return { reservedUntil: updated.reserved_until as string };
  });

/** Give a mission back to the pool before the timer expires. */
export const releaseMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { missionId: string }) => {
    if (!input?.missionId) throw new Error("Invalid mission");
    return { missionId: input.missionId };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("missions")
      .update({ reserved_by: null, reserved_until: null })
      .eq("id", data.missionId)
      .eq("reserved_by", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Submit the Reddit link for a mission the worker currently holds. */
export const submitMissionLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { missionId: string; url: string }) => {
    const url = String(input?.url ?? "").trim();
    if (!input?.missionId) throw new Error("Invalid mission");
    if (!/^https?:\/\/(www\.|old\.|new\.)?reddit\.com\/.+/i.test(url)) {
      throw new Error("Enter a valid Reddit link.");
    }
    return { missionId: input.missionId, url };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("id, payout, reserved_by, reserved_until, is_locked")
      .eq("id", data.missionId)
      .maybeSingle();
    if (missionError) throw new Error(missionError.message);
    if (!mission) throw new Error("Mission not found.");
    if (mission.is_locked) throw new Error("This mission is no longer available.");
    if (
      mission.reserved_by !== userId ||
      !mission.reserved_until ||
      new Date(mission.reserved_until).getTime() < Date.now()
    ) {
      throw new Error("Your reservation expired. Take the mission again to submit your link.");
    }

    const { error } = await supabase.from("submissions").insert({
      mission_id: mission.id,
      user_id: userId,
      submitted_url: data.url,
      amount: mission.payout,
    });
    if (error) {
      if (error.code === "23505") {
        throw new Error("This mission was just taken by another member.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });
