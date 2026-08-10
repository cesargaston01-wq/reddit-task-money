import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";


export type Profile = Tables<"profiles">;
export type Mission = Tables<"missions">;
export type Submission = Tables<"submissions">;

export const PAYOUT_POST = 5;
export const PAYOUT_COMMENT = 3;

/**
 * Resolves the signed-in user from the persisted session first.
 * `getSession()` reads local storage and refreshes the token when needed, so it
 * keeps working on mobile networks where a single `getUser()` call can fail and
 * make the app look signed out.
 */
export async function getCurrentUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  return sessionData.session.user;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    staleTime: 30_000,
    retry: 2,
    queryFn: async () => await getCurrentUser(),
  });
}


export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useMissions(type: "post" | "comment") {
  return useQuery({
    queryKey: ["missions", type],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const columns = sessionData.session
        ? "*"
        : "id,type,title,subreddit,community_url,payout,is_active,is_locked,created_at,reserved_until";
      const { data, error } = await supabase
        .from("missions")
        .select(columns)
        .eq("type", type)
        .eq("is_active", true)
        .eq("is_locked", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Mission[];
    },
  });
}


export function useAllMissions() {
  return useQuery({
    queryKey: ["missions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Mission[];
    },
  });
}

export function useMySubmissions() {
  return useQuery({
    queryKey: ["submissions", "mine"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("submissions")
        .select("*, missions(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Submission & { missions: Mission | null })[];
    },
  });
}

export const DAILY_LIMITS: Record<"post" | "comment", number> = { post: 1, comment: 3 };

/** How many missions of a given type the member already submitted today (rejected ones don't count). */
export function useDailyQuota(type: "post" | "comment") {
  const { data, isLoading } = useMySubmissions();
  const limit = DAILY_LIMITS[type];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const used = (data ?? []).filter(
    (s) =>
      s.missions?.type === type &&
      s.status !== "rejected" &&
      new Date(s.created_at).getTime() >= startOfDay.getTime(),
  ).length;
  return { used, limit, remaining: Math.max(0, limit - used), reached: used >= limit, isLoading };
}

export function useAllSubmissions() {

  return useQuery({
    queryKey: ["submissions", "all"],
    queryFn: async () => {
      const [subs, profiles] = await Promise.all([
        supabase.from("submissions").select("*, missions(*)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);
      if (subs.error) throw subs.error;
      if (profiles.error) throw profiles.error;
      const byId = new Map((profiles.data as Profile[]).map((p) => [p.id, p]));
      return (subs.data as (Submission & { missions: Mission | null })[]).map((s) => ({
        ...s,
        profile: byId.get(s.user_id) ?? null,
      }));
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useSubmitMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mission, url }: { mission: Mission; url: string }) => {
      const submittedUrl = url.trim();
      if (!/^https?:\/\/(www\.|old\.|new\.)?reddit\.com\/.+/i.test(submittedUrl)) {
        throw new Error("Enter a valid Reddit link.");
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Sign in again before submitting your link.");
      }

      const { error } = await supabase.from("submissions").insert({
        mission_id: mission.id,
        user_id: user.id,
        submitted_url: submittedUrl,
        amount: mission.payout,
      });

      if (error?.code === "23505") {
        throw new Error("This mission was just taken by another member.");
      }
      if (error?.code === "42501") {
        throw new Error("Your reservation expired. Take the mission again to submit your link.");
      }
      if (error?.message?.includes("Daily limit reached")) {
        const limit = DAILY_LIMITS[mission.type as "post" | "comment"];
        throw new Error(
          `Daily limit reached: ${limit} ${mission.type} mission${limit > 1 ? "s" : ""} per day and per account. Come back tomorrow.`,
        );
      }

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useReserveMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (missionId: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Sign in again before taking a mission.");
      }

      const now = new Date();
      const reservedUntil = new Date(now.getTime() + 10 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("missions")
        .update({ reserved_by: user.id, reserved_until: reservedUntil })
        .eq("id", missionId)
        .eq("is_active", true)
        .eq("is_locked", false)
        .or(
          `reserved_until.is.null,reserved_until.lt.${now.toISOString()},reserved_by.eq.${user.id}`,
        )
        .select("id, reserved_until")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("This mission was just reserved by another member.");
      return { reservedUntil: data.reserved_until };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
}

export function useReleaseMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (missionId: string) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Sign in again before releasing a mission.");
      }

      const { data, error } = await supabase
        .from("missions")
        .update({ reserved_by: null, reserved_until: null })
        .eq("id", missionId)
        .eq("reserved_by", user.id)
        .select("id")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("This reservation is no longer active.");
      return { ok: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
}


export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries();
  };
}
