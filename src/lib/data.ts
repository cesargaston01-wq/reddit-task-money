import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  reserveMission,
  releaseMission,
  submitMissionLink,
} from "@/lib/missions.functions";


export type Profile = Tables<"profiles">;
export type Mission = Tables<"missions">;
export type Submission = Tables<"submissions">;

export const PAYOUT_POST = 5;
export const PAYOUT_COMMENT = 3;

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
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
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("type", type)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Mission[];
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      const { data, error } = await supabase
        .from("submissions")
        .select("*, missions(*)")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Submission & { missions: Mission | null })[];
    },
  });
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
      await submitMissionLink({ data: { missionId: mission.id, url } });
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
    mutationFn: async (missionId: string) => reserveMission({ data: { missionId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
}

export function useReleaseMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (missionId: string) => releaseMission({ data: { missionId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["missions"] }),
  });
}


export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries();
  };
}
