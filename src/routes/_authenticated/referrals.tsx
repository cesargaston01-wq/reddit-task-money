import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Gift, Loader2, UserPlus, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — TaskReddit" },
      { name: "description", content: "Invite friends to TaskReddit and earn USDC for every validated member and mission." },
      { property: "og:title", content: "Referrals — TaskReddit" },
      { property: "og:description", content: "Earn $1 per validated invite and $0.50 per mission they complete." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReferralsPage,
});

const SITE = "https://reddit-task-money.lovable.app";

type Referral = { username: string; status: string; joined_at: string; approved_missions: number; earned: number };
type AdminRow = { referrer_id: string; username: string; wallet: string; invited: number; validated: number; approved_missions: number; earned: number };

function ReferralsPage() {
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const [copied, setCopied] = useState(false);

  const { data: refs, isLoading } = useQuery({
    queryKey: ["referrals", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_referrals" as never);
      if (error) throw error;
      return (data ?? []) as unknown as Referral[];
    },
  });

  const { data: adminRows } = useQuery({
    queryKey: ["referrals", "admin"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_referral_earnings" as never);
      if (error) throw error;
      return (data ?? []) as unknown as AdminRow[];
    },
  });

  const code = (profile as { referral_code?: string } | null | undefined)?.referral_code;
  const link = code ? `${SITE}/auth?ref=${code}` : "";
  const list = refs ?? [];
  const validated = list.filter((r) => r.status === "accepted").length;
  const missions = list.reduce((s, r) => s + Number(r.approved_missions), 0);
  const earned = list.reduce((s, r) => s + Number(r.earned), 0);

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout title="Referrals" description="Invite friends and earn USDC on their activity.">
      <div className="space-y-6">
        <div className="panel space-y-4 p-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Gift className="h-5 w-5 text-primary" /> Your invite link
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={link || "Loading…"} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} disabled={!link}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface/40 p-4">
              <div className="font-display text-2xl font-bold text-primary">$1.00</div>
              <p className="mt-1 text-sm text-muted-foreground">for every person who signs up with your link and gets their account validated.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface/40 p-4">
              <div className="font-display text-2xl font-bold text-primary">$0.50</div>
              <p className="mt-1 text-sm text-muted-foreground">for every mission your invitee completes and that gets approved — forever.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Rewards are paid in USDC on Ethereum to the wallet saved in your profile, together with your mission payouts.
            Self-referrals and fake accounts are not rewarded.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={UserPlus} label="Invited" value={String(list.length)} />
          <Stat icon={Check} label="Validated" value={String(validated)} />
          <Stat icon={Gift} label="Their approved missions" value={String(missions)} />
          <Stat icon={Wallet} label="Referral earnings" value={`$${earned.toFixed(2)}`} />
        </div>

        <div className="panel p-6">
          <div className="mb-4 font-display text-lg font-bold">Your invitees</div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody yet. Share your link to start earning.</p>
          ) : (
            <div className="divide-y divide-border">
              {list.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">u/{r.username || "member"}</div>
                    <div className="text-xs text-muted-foreground">Joined {new Date(r.joined_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <span className="text-muted-foreground">{r.approved_missions} missions</span>
                    <span className="font-semibold">${Number(r.earned).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="panel p-6">
            <div className="mb-1 font-display text-lg font-bold">Admin — referral payouts</div>
            <p className="mb-4 text-xs text-muted-foreground">Total referral rewards earned per member (all time).</p>
            {!adminRows?.length ? (
              <p className="text-sm text-muted-foreground">No referrals yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {adminRows.map((r) => (
                  <div key={r.referrer_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">u/{r.username || "member"}</div>
                      <div className="break-all text-xs text-muted-foreground">{r.wallet || "No wallet"}</div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{r.invited} invited</span>
                      <span>{r.validated} validated</span>
                      <span>{r.approved_missions} missions</span>
                      <span className="font-semibold text-foreground">${Number(r.earned).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted") return <Badge className="bg-success text-success-foreground">Validated</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
