import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMySubmissions, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TaskReddit" },
      { name: "description", content: "Your crypto wallet, your Reddit profile and your earnings." },
    ],
  }),
  component: ProfilePage,
});

const MAX_NICHES = 12;

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { data: subs } = useMySubmissions();
  const qc = useQueryClient();
  const [wallet, setWallet] = useState("");
  const [saving, setSaving] = useState(false);
  const [niches, setNiches] = useState<string[]>([]);
  const [nicheInput, setNicheInput] = useState("");
  const [savingNiches, setSavingNiches] = useState(false);

  useEffect(() => {
    if (profile) {
      setWallet(profile.wallet_address);
      setNiches(profile.niches ?? []);
    }
  }, [profile]);

  const done = subs?.length ?? 0;
  const approved = subs?.filter((s) => s.status === "approved") ?? [];
  const pending = subs?.filter((s) => s.status === "pending").length ?? 0;
  const earned = approved.reduce((sum, s) => sum + Number(s.amount), 0);

  function addNiche(raw: string) {
    const clean = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!clean) return;
    if (niches.length >= MAX_NICHES) return toast.error(`Maximum ${MAX_NICHES} topics.`);
    if (niches.some((n) => n.toLowerCase() === clean.toLowerCase())) return;
    setNiches([...niches, clean]);
    setNicheInput("");
  }

  async function saveNiches() {
    setSavingNiches(true);
    const { error } = await supabase
      .from("profiles")
      .update({ niches })
      .eq("id", profile!.id);
    setSavingNiches(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Topics updated.");
  }

  async function save() {
    const clean = wallet.trim();
    if (clean.length < 10 || clean.length > 120) return toast.error("Invalid wallet address.");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ wallet_address: clean })
      .eq("id", profile!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Wallet updated.");
  }


  return (
    <DashboardLayout title="Profile" description="Your details and your earnings.">
      {isLoading || !profile ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Missions completed" value={String(done)} />
            <Stat label="Total earned" value={`$${earned.toFixed(0)}`} />
            <Stat label="Pending" value={String(pending)} />
            <Stat label="Approved" value={String(approved.length)} />
          </div>

          <div className="panel space-y-4 p-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Account status</div>
              <div className="mt-2">
                {profile.status === "accepted" ? (
                  <Badge className="bg-success text-success-foreground">Accepted</Badge>
                ) : profile.status === "rejected" ? (
                  <Badge variant="destructive">Rejected</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Reddit profile</div>
              <a
                href={profile.reddit_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block break-all text-sm text-primary hover:underline"
              >
                {profile.reddit_profile_url || "—"}
              </a>
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Where is your account most active?</Label>
              <p className="text-xs text-muted-foreground">
                Add your own topics — e.g. marketing, seo, B2B, apps, france, cars, cooking. Press Enter to add.
              </p>
              {niches.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {niches.map((n) => (
                    <Badge key={n} variant="secondary" className="gap-1 pr-1">
                      {n}
                      <button
                        type="button"
                        aria-label={`Remove ${n}`}
                        onClick={() => setNiches(niches.filter((x) => x !== n))}
                        className="rounded-full p-0.5 hover:bg-background/60"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="niche"
                  value={nicheInput}
                  maxLength={30}
                  placeholder="marketing"
                  onChange={(e) => setNicheInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addNiche(nicheInput);
                    } else if (e.key === "Backspace" && !nicheInput && niches.length) {
                      setNiches(niches.slice(0, -1));
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => addNiche(nicheInput)}>
                  Add
                </Button>
                <Button
                  onClick={saveNiches}
                  disabled={
                    savingNiches ||
                    JSON.stringify(niches) === JSON.stringify(profile.niches ?? [])
                  }
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">Payout wallet — USDC on Ethereum</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="wallet"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  maxLength={120}
                  placeholder="0x..."
                />
                <Button onClick={save} disabled={saving || wallet === profile.wallet_address}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Payments are sent manually in USDC on the Ethereum blockchain. Make sure this address supports ERC-20 tokens.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
