import { formatAmount } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DAILY_LIMITS,
  useDailyQuota,
  useMissionBrief,
  useMissions,
  useProfile,
  useReleaseMission,
  useReserveMission,
  useSession,
  useSubmitMission,
  type Mission,
} from "@/lib/data";



/**
 * Static teaser missions shown to visitors who cannot submit yet.
 * They are never fetched from the database: they only prove that
 * opportunities exist before signing up.
 */
const PREVIEW_SUBREDDITS = [
  "personalfinance",
  "Entrepreneur",
  "fitness",
  "SaaS",
  "productivity",
  "startups",
  "cryptocurrency",
  "webdev",
  "marketing",
  "sidehustle",
];

function buildPreviewMissions(type: "post" | "comment"): Mission[] {
  return PREVIEW_SUBREDDITS.map(
    (subreddit, i) =>
      ({
        id: `preview-${type}-${i}`,
        type,
        title:
          type === "post"
            ? `Sponsored post opportunity in r/${subreddit}`
            : `Comment opportunity in r/${subreddit}`,
        subreddit,
        payout: type === "post" ? 5 : 3.5,
        is_active: true,
        is_locked: false,
        reserved_by: null,
        reserved_until: null,
        community_url: null,
        target_post_url: null,
        post_title: null,
        post_body: null,
        comment_text: null,
        flair: null,
        instructions: null,
        created_at: new Date().toISOString(),
      }) as unknown as Mission,
  );
}

const PREVIEW_MISSIONS = {
  post: buildPreviewMissions("post"),
  comment: buildPreviewMissions("comment"),
};


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

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function formatLeft(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
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
  const { data: realMissions, isLoading: realLoading, refetch } = useMissions(type);
  // Visitors always see a fixed teaser list, independent from the database.
  const missions = canSubmit ? realMissions : PREVIEW_MISSIONS[type];
  const isLoading = canSubmit && realLoading;
  const { data: user } = useSession();
  const submit = useSubmitMission();
  const reserve = useReserveMission();
  const release = useReleaseMission();
  const quota = useDailyQuota(type);
  const quotaReached = canSubmit && quota.reached;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const now = useNow(true);

  const selected = missions?.find((m) => m.id === selectedId) ?? null;
  const heldBy = (m: Mission) =>
    !!user &&
    m.reserved_by === user.id &&
    !!m.reserved_until &&
    new Date(m.reserved_until).getTime() > now;
  const held = selected ? heldBy(selected) : false;
  const msLeft =
    selected?.reserved_until ? new Date(selected.reserved_until).getTime() - now : 0;
  const brief = useMissionBrief(selected?.id ?? null, canSubmit && held);

  useEffect(() => {
    if (selected && selected.reserved_by === user?.id && msLeft <= 0 && msLeft > -2000) {
      toast.warning("Reservation expired — the mission is back online for everyone.");
      refetch();
    }
  }, [msLeft, selected, user?.id, refetch]);

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

  function onReserve() {
    if (!selected) return;
    reserve.mutate(selected.id, {
      onSuccess: () =>
        toast.success("Mission reserved for 10 minutes. The Reddit link is now unlocked."),
      onError: (err) => {
        toast.error(err.message);
        // Someone else got it first: close the window and refresh the list.
        setSelectedId(null);
        refetch();
      },
    });
  }

  function onRelease() {
    if (!selected) return;
    release.mutate(selected.id, {
      onSuccess: () => toast.message("Mission released — it's available again for everyone."),
      onError: (err) => toast.error(err.message),
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const clean = url.trim();
    if (!/^https?:\/\/(www\.|old\.|new\.)?reddit\.com\/.+/i.test(clean)) {
      toast.error("Enter a valid Reddit link (https://reddit.com/…).");
      return;
    }
    submit.mutate(
      { mission: selected, url: clean },
      {
        onSuccess: () => {
          toast.success("Link submitted. Your mission is pending review.");
          setSelectedId(null);
          setUrl("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <div className="mb-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-primary" /> Always take the mission before doing it
        </p>
        <ol className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <li className="rounded-lg border border-border bg-background/60 p-2.5">
            <span className="font-semibold text-foreground">1. Take the mission</span>
            <br />
            It's reserved for you for 10 minutes and disappears for everyone else.
          </li>
          <li className="rounded-lg border border-border bg-background/60 p-2.5">
            <span className="font-semibold text-foreground">2. Open the unlocked link</span>
            <br />
            The Reddit link and the comment only appear once the mission is yours.
          </li>
          <li className="rounded-lg border border-border bg-background/60 p-2.5">
            <span className="font-semibold text-foreground">3. Submit your link</span>
            <br />
            Paste your comment link before the 10 minutes run out.
          </li>
        </ol>
        <p className="mt-3 text-xs font-medium text-destructive">
          A comment posted without taking the mission first will not be paid.
        </p>
      </div>
      {canSubmit ? (
        <div
          className={`mb-3 flex items-start gap-2 rounded-lg border p-3 text-xs ${
            quotaReached
              ? "border-warning/50 bg-warning/10 text-warning"
              : "border-border bg-background/60 text-muted-foreground"
          }`}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {quotaReached
              ? `Daily limit reached: ${DAILY_LIMITS[type]} ${type} mission${
                  DAILY_LIMITS[type] > 1 ? "s" : ""
                } per day and per account. Come back tomorrow.`
              : `Account safety limit: ${DAILY_LIMITS[type]} ${type} mission${
                  DAILY_LIMITS[type] > 1 ? "s" : ""
                } per day — ${quota.remaining} left today.`}
          </span>
        </div>
      ) : null}
      <div className="grid gap-3">

        {missions.map((m) => {
          const mine = heldBy(m);
          return (
            <button
              key={m.id}
              onClick={() => {
                setSelectedId(m.id);
                setUrl("");
              }}
              className={`panel flex flex-col gap-3 p-5 text-left transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between ${
                mine ? "border-primary/60" : ""
              }`}
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
                  {mine ? (
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      <Timer className="h-3 w-3" />
                      Reserved for you · {formatLeft(new Date(m.reserved_until!).getTime() - now)}
                    </span>
                  ) : null}
                  {canSubmit ? null : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Lock className="h-3 w-3" /> Details locked
                    </span>
                  )}
                </div>
              </div>

              <Badge className="w-fit shrink-0 text-sm">${formatAmount(m.payout)}</Badge>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
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
                  <Badge>${formatAmount(selected.payout)}</Badge>
                  {held ? (
                    <Badge variant="outline" className="border-primary/60 text-primary">
                      <Timer className="mr-1 h-3 w-3" /> {formatLeft(msLeft)} left
                    </Badge>
                  ) : null}
                </div>

                {held && brief.data ? (
                  <div className="space-y-5">
                    <Field label={type === "post" ? "Reddit community" : "Reddit post to comment on"}>
                      <LinkOut
                        href={
                          type === "post"
                            ? brief.data.community_url || `https://reddit.com/r/${selected.subreddit}`
                            : brief.data.target_post_url ||
                              brief.data.community_url ||
                              `https://reddit.com/r/${selected.subreddit}`
                        }
                      />
                    </Field>
                    {type === "post" ? (
                      <>
                        <Field label="Exact title to use">
                          <pre className="whitespace-pre-wrap font-sans">{brief.data.post_title}</pre>
                        </Field>
                        <Field label="Full body">
                          <pre className="whitespace-pre-wrap font-sans">{brief.data.post_body}</pre>
                        </Field>
                        {brief.data.flair ? (
                          <Field label="Flair to select">{brief.data.flair}</Field>
                        ) : null}
                      </>
                    ) : (
                      <Field label="Exact comment to publish">
                        <pre className="whitespace-pre-wrap font-sans">{brief.data.comment_text}</pre>
                      </Field>
                    )}
                    {brief.data.instructions ? (
                      <Field label="Specific instructions">
                        <pre className="whitespace-pre-wrap font-sans">{brief.data.instructions}</pre>
                      </Field>
                    ) : null}
                  </div>
                ) : held && brief.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Unlocking the Reddit link…
                  </div>
                ) : held && brief.isError ? (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {brief.error.message}
                  </p>
                ) : (
                  <div className="space-y-5">
                    <LockedBrief
                      type={type}
                      message={
                        canSubmit
                          ? "Take the mission to unlock the Reddit link"
                          : "Sign in with a verified account to see the link"
                      }
                    />
                    {canSubmit && type === "comment" && selected.comment_text ? (
                      <Field label="Exact comment to publish">
                        <pre className="whitespace-pre-wrap font-sans">{selected.comment_text}</pre>
                      </Field>
                    ) : null}
                    {canSubmit && type === "post" && selected.post_title ? (
                      <>
                        <Field label="Exact title to use">
                          <pre className="whitespace-pre-wrap font-sans">{selected.post_title}</pre>
                        </Field>
                        {selected.post_body ? (
                          <Field label="Full body">
                            <pre className="whitespace-pre-wrap font-sans">{selected.post_body}</pre>
                          </Field>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                )}

                <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-destructive">Do not copy-paste — write by hand</p>
                    <p className="mt-1 text-muted-foreground">
                      Reddit's algorithms detect copied content. Type the title, body, or comment
                      manually instead of pasting it. Your submission will be rejected if it looks
                      copy-pasted.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-warning">Follow the instructions exactly</p>
                    <p className="mt-1 text-muted-foreground">
                      Do not change anything in the title, body, comment, flair or instructions. Any
                      modification means your submission will not be accepted and will not be paid.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-destructive">Stay natural between tasks</p>
                    <p className="mt-1 text-muted-foreground">
                      Between each paid task, leave normal comments and stay active on Reddit like
                      any regular user. If you only post sponsored content, your account may be
                      flagged, banned or deleted.
                    </p>
                  </div>
                </div>

                <p className="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                  The publication must stay online for at least 3 hours and must not be deleted after
                  payment.
                </p>

                {canSubmit ? (
                  held ? (
                    <div className="space-y-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="text-xs leading-relaxed">
                          <p className="font-semibold text-primary">
                            Mission reserved for you — {formatLeft(msLeft)} left
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            Nobody else can see or take it during this time. Publish on Reddit, then
                            paste your link below. If the timer runs out without a link, the mission
                            is automatically put back online for everyone.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={onSubmit} className="space-y-3">
                        <label className="block text-xs font-medium text-muted-foreground">
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
                          {submit.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Submit my link
                        </Button>
                      </form>

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground"
                        onClick={onRelease}
                        disabled={release.isPending}
                      >
                        {release.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Release the mission
                      </Button>
                    </div>
                  ) : quotaReached ? (
                    <div className="space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
                      <p className="flex items-start gap-2 text-xs leading-relaxed text-warning">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Daily limit reached — {DAILY_LIMITS[type]} {type} mission
                        {DAILY_LIMITS[type] > 1 ? "s" : ""} per day and per account. This protects
                        your Reddit account. Come back tomorrow to take a new one.
                      </p>
                      <Button className="w-full" disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        Daily limit reached
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Take the mission first: it unlocks the Reddit link and reserves the mission
                        for you for 10 minutes. It disappears for everyone else, and comes back
                        online automatically if you don't submit a link in time. Don't comment
                        before taking it — that comment won't be paid.
                      </p>
                      <Button className="w-full" onClick={onReserve} disabled={reserve.isPending}>
                        {reserve.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Timer className="mr-2 h-4 w-4" />
                        )}
                        Take this mission (10 min)
                      </Button>
                    </div>
                  )

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

/**
 * Blurred stand-in for the Reddit link and the brief. It only contains fake
 * text: the real link is never loaded before the member reserves the mission.
 */
function LockedBrief({ type, message }: { type: "post" | "comment"; message: string }) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none space-y-5 blur-[6px]">
        <Field label={type === "post" ? "Reddit community" : "Reddit post to comment on"}>
          <span className="text-primary">https://www.reddit.com/r/xxxxxxxx/comments/xxxxxx/xxxxxxxxxxxx</span>
        </Field>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-background/90 px-4 py-2 text-center text-xs font-medium text-foreground backdrop-blur-sm">
          <Lock className="h-3.5 w-3.5 shrink-0 text-primary" /> {message}
        </span>
      </div>
    </div>
  );
}
