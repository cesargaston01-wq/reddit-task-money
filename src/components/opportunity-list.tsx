import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Clock, ExternalLink, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMissions, useProfile, useSubmitMission, type Mission } from "@/lib/data";

function PendingState({ status, reason }: { status?: string; reason?: string | null }) {
  if (status === "rejected") {
    return (
      <div className="panel p-8 text-center">
        <Lock className="mx-auto h-6 w-6 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Account rejected</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {reason ||
            "Your Reddit account doesn't meet the requirements (3 months old, 100+ karma, overall quality)."}
        </p>
      </div>
    );
  }
  return (
    <div className="panel p-8 text-center">
      <Clock className="mx-auto h-6 w-6 text-warning" />
      <h2 className="mt-4 text-lg font-semibold">Account pending review</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We're reviewing your Reddit account (3 months old, 100+ karma, overall quality). Missions
        will appear here as soon as you're approved.
      </p>
    </div>
  );
}

export function OpportunityList({ type }: { type: "post" | "comment" }) {
  const { data: profile, isLoading: loadingProfile } = useProfile();

  if (loadingProfile) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (profile?.status !== "accepted") {
    return <PendingState status={profile?.status} reason={profile?.rejection_reason} />;
  }
  return <MissionBrowser type={type} canSubmit />;
}

export function MissionBrowser({
  type,
  canSubmit,
  lockedMessage,
}: {
  type: "post" | "comment";
  canSubmit: boolean;
  lockedMessage?: string;
}) {
  const { data: missions, isLoading } = useMissions(type);
  const submit = useSubmitMission();
  const [selected, setSelected] = useState<Mission | null>(null);
  const [url, setUrl] = useState("");

  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (!missions?.length) {
    return (
      <div className="panel p-8 text-center text-sm text-muted-foreground">
        No mission available right now. Check back soon.
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const clean = url.trim();
    if (!/^https?:\/\/(www\.|old\.)?reddit\.com\/.+/i.test(clean)) {
      toast.error("Enter a valid Reddit link.");
      return;
    }
    submit.mutate(
      { mission: selected, url: clean },
      {
        onSuccess: () => {
          toast.success("Mission submitted. It's pending review.");
          setSelected(null);
          setUrl("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setSelected(m);
              setUrl("");
            }}
            className="panel flex flex-col gap-3 p-5 text-left transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <h3
                className={`truncate text-base font-semibold ${
                  canSubmit ? "" : "select-none blur-[5px]"
                }`}
              >
                {m.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>r/{m.subreddit}</span>
                {canSubmit ? null : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-3 w-3" /> Details locked
                  </span>
                )}
              </div>
            </div>

            <Badge className="w-fit shrink-0 text-sm">${Number(m.payout).toFixed(0)}</Badge>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className={canSubmit ? "" : "select-none blur-[6px]"}>
                  {selected.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">r/{selected.subreddit}</Badge>
                  <Badge>${Number(selected.payout).toFixed(0)}</Badge>
                </div>

                <Field label="Reddit community">
                  <LinkOut
                    href={
                      type === "post"
                        ? selected.community_url || `https://reddit.com/r/${selected.subreddit}`
                        : selected.target_post_url || `https://reddit.com/r/${selected.subreddit}`
                    }
                  />
                </Field>

                <Blurred hidden={!canSubmit}>
                  {type === "post" ? (
                    <>
                      <Field label="Exact title to use">
                        <pre className="whitespace-pre-wrap font-sans">{selected.post_title}</pre>
                      </Field>
                      <Field label="Full body">
                        <pre className="whitespace-pre-wrap font-sans">{selected.post_body}</pre>
                      </Field>
                      {selected.flair ? <Field label="Flair to select">{selected.flair}</Field> : null}
                    </>
                  ) : (
                    <Field label="Exact comment to publish">
                      <pre className="whitespace-pre-wrap font-sans">{selected.comment_text}</pre>
                    </Field>
                  )}

                  {selected.instructions ? (
                    <Field label="Specific instructions">
                      <pre className="whitespace-pre-wrap font-sans">{selected.instructions}</pre>
                    </Field>
                  ) : null}
                </Blurred>

                <p className="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                  The publication must stay online for at least 3 hours and must not be deleted after
                  payment.
                </p>


                {canSubmit ? (
                  <form onSubmit={onSubmit} className="space-y-3">
                    <label className="text-xs font-medium text-muted-foreground">
                      {type === "post" ? "Link to your Reddit post" : "Link to your comment"}
                    </label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://reddit.com/r/…"
                      required
                      maxLength={500}
                    />
                    <Button type="submit" className="w-full" disabled={submit.isPending}>
                      {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Take this mission
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {lockedMessage ??
                        "Read-only: only members with a verified account can take this mission."}
                    </p>
                    <Button asChild className="w-full">
                      <Link to="/auth">Sign in with a verified account to apply</Link>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1.5 rounded-lg border border-border bg-background/50 p-3 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function LinkOut({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 break-all text-primary hover:underline"
    >
      {href} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}
