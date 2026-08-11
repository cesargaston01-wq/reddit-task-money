import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ComponentType } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Radio,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllMissions,
  useAllProfiles,
  useAllSubmissions,
  useIsAdmin,
  type Mission,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — TaskReddit" },
      { name: "description", content: "Manage missions, submissions and Reddit accounts." },
    ],
  }),
  component: AdminPage,
});

type Draft = Partial<Mission> & { type: "post" | "comment" };
type SubmissionTypeFilter = "all" | "post" | "comment";
type SubmissionStatusFilter = "all" | "pending" | "approved" | "rejected";

function extractRedditSubreddit(value: string) {
  const match = value.match(/(?:^|\/)r\/([^/?#]+)/i);
  return match?.[1]?.trim().replace(/^r\//i, "") ?? "";
}

function AdminPage() {
  const { data: isAdmin, isLoading: loadingRole } = useIsAdmin();
  const qc = useQueryClient();
  const { data: missions } = useAllMissions();
  const { data: submissions } = useAllSubmissions();
  const { data: profiles } = useAllProfiles();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [submittedFilter, setSubmittedFilter] = useState<"all" | "yes" | "no">("all");
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState<SubmissionTypeFilter>("all");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<SubmissionStatusFilter>("all");

  if (loadingRole) {
    return (
      <DashboardLayout title="Administration">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </DashboardLayout>
    );
  }
  if (!isAdmin) {
    return (
      <DashboardLayout title="Administration">
        <div className="panel p-8 text-center text-sm text-muted-foreground">Access restricted.</div>
      </DashboardLayout>
    );
  }

  const toPay = (submissions ?? [])
    .filter((s) => s.status === "approved" && !s.paid)
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const fmtDate = (v: string) =>
    new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  type AdminSubmission = NonNullable<typeof submissions>[number];
  const activity = new Map<
    string,
    { last: AdminSubmission; approved: number; earned: number; total: number }
  >();
  for (const s of submissions ?? []) {
    const cur = activity.get(s.user_id);
    if (!cur) {
      activity.set(s.user_id, {
        last: s,
        approved: s.status === "approved" ? 1 : 0,
        earned: s.status === "approved" ? Number(s.amount) : 0,
        total: 1,
      });
    } else {
      if (new Date(s.created_at) > new Date(cur.last.created_at)) cur.last = s;
      cur.total += 1;
      if (s.status === "approved") {
        cur.approved += 1;
        cur.earned += Number(s.amount);
      }
    }
  }

  const query = userSearch.trim().toLowerCase();
  const visibleProfiles = (profiles ?? [])
    .filter((p) => (userFilter === "all" ? true : p.status === userFilter))
    .filter((p) =>
      submittedFilter === "all" ? true : submittedFilter === "yes" ? activity.has(p.id) : !activity.has(p.id),
    )
    .filter((p) =>
      !query
        ? true
        : `${p.full_name} ${p.email} ${p.reddit_profile_url} ${(p.niches ?? []).join(" ")}`
            .toLowerCase()
            .includes(query),
    )
    .sort((a, b) => {
      const la = activity.get(a.id)?.last.created_at;
      const lb = activity.get(b.id)?.last.created_at;
      if (la && lb) return new Date(lb).getTime() - new Date(la).getTime();
      if (la) return -1;
      if (lb) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const profileStats = {
    total: profiles?.length ?? 0,
    pending: profiles?.filter((profile) => profile.status === "pending").length ?? 0,
    accepted: profiles?.filter((profile) => profile.status === "accepted").length ?? 0,
    rejected: profiles?.filter((profile) => profile.status === "rejected").length ?? 0,
  };

  const liveMissions = (missions ?? []).filter((mission) => mission.is_active && !mission.is_locked);
  const submissionStats = {
    total: submissions?.length ?? 0,
    posts: submissions?.filter((submission) => submission.missions?.type === "post").length ?? 0,
    comments: submissions?.filter((submission) => submission.missions?.type === "comment").length ?? 0,
    pending: submissions?.filter((submission) => submission.status === "pending").length ?? 0,
    approved: submissions?.filter((submission) => submission.status === "approved").length ?? 0,
    rejected: submissions?.filter((submission) => submission.status === "rejected").length ?? 0,
  };
  const visibleSubmissions = (submissions ?? []).filter((submission) => {
    const notRejected = submission.status !== "rejected";
    const matchesType = submissionTypeFilter === "all" || submission.missions?.type === submissionTypeFilter;
    const matchesStatus = submissionStatusFilter === "all" || submission.status === submissionStatusFilter;
    return notRejected && matchesType && matchesStatus;
  });

  async function saveMission() {
    if (!draft) return;

    const communityUrl = (draft.community_url ?? "").trim();
    const targetPostUrl = (draft.target_post_url ?? "").trim();
    const subreddit = extractRedditSubreddit(draft.type === "post" ? communityUrl : targetPostUrl);
    const payload = {
      type: draft.type,
      title: (draft.title ?? "").trim(),
      subreddit,
      community_url: draft.type === "post" ? communityUrl : "",
      payout: Number(draft.payout ?? (draft.type === "post" ? 5 : 3)),
      post_title: draft.post_title ?? null,
      post_body: draft.post_body ?? null,
      flair: draft.flair ?? null,
      instructions: draft.instructions ?? null,
      target_post_url: draft.type === "comment" ? targetPostUrl : null,
      comment_text: draft.comment_text ?? null,
      is_active: draft.is_active ?? true,
    };
    if (!payload.title || !payload.subreddit) {
      return toast.error(
        draft.type === "post"
          ? "Enter a valid Reddit community link."
          : "Enter a valid Reddit post link.",
      );
    }

    const { error } = draft.id
      ? await supabase.from("missions").update(payload).eq("id", draft.id)
      : await supabase.from("missions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Mission saved.");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["missions"] });
  }

  async function removeMission(id: string) {
    const { error } = await supabase.from("missions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["missions"] });
    toast.success("Mission deleted.");
  }

  async function reviewSubmission(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("submissions")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["submissions"] });
    qc.invalidateQueries({ queryKey: ["missions"] });
    toast.success(status === "approved" ? "Submission approved." : "Submission rejected.");
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("submissions").update({ paid: true }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["submissions"] });
  }

  async function setAccountStatus(id: string, status: "accepted" | "rejected" | "pending") {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profiles"] });
    toast.success("Status updated.");
  }

  return (
    <DashboardLayout title="Administration" description={`Total amount to pay: $${toPay.toFixed(0)}`}>
      <section aria-label="Account overview" className="mb-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Account overview</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Registration and verification status at a glance.</p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">Live totals</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatusMetric icon={UserRound} label="Registered" value={profileStats.total} tone="neutral" />
          <StatusMetric icon={Clock3} label="Pending review" value={profileStats.pending} tone="warning" />
          <StatusMetric icon={CheckCircle2} label="Accepted" value={profileStats.accepted} tone="success" />
          <StatusMetric icon={XCircle} label="Rejected" value={profileStats.rejected} tone="destructive" />
        </div>
      </section>

      <Tabs defaultValue="missions">
        <TabsList>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="users">Users ({profileStats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDraft({ type: "post", payout: 5 })}>
              <Plus className="mr-1 h-4 w-4" /> Post mission
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDraft({ type: "comment", payout: 3 })}>
              <Plus className="mr-1 h-4 w-4" /> Comment mission
            </Button>
          </div>
          <div className="grid gap-3">
            {(missions ?? []).map((m) => (
              <div key={m.id} className="panel flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.type === "post" ? "Post" : "Comment"} · r/{m.subreddit} · $
                    {Number(m.payout).toFixed(0)} {m.is_active ? "" : "· inactive"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setDraft(m as Draft)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeMission(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6 space-y-4">
          <section aria-label="Submission overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SubmissionMetric icon={Radio} label="Live missions" value={liveMissions.length} detail={`${liveMissions.filter((mission) => mission.type === "post").length} posts · ${liveMissions.filter((mission) => mission.type === "comment").length} comments`} tone="primary" />
            <SubmissionMetric icon={FileText} label="Post submissions" value={submissionStats.posts} detail={`${submissionStats.approved} approved overall`} tone="neutral" />
            <SubmissionMetric icon={MessageSquare} label="Comment submissions" value={submissionStats.comments} detail={`${submissionStats.pending} waiting for review`} tone="neutral" />
            <SubmissionMetric icon={CircleDollarSign} label="Awaiting review" value={submissionStats.pending} detail={`${submissionStats.total} total submissions`} tone="warning" />
          </section>

          <div className="panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Submission queue</p>
              <p className="text-xs text-muted-foreground">Review links submitted by your Reddit workers.</p>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {(["all", "post", "comment"] as const).map((filter) => (
                <Button key={filter} size="sm" variant={submissionTypeFilter === filter ? "default" : "outline"} className="shrink-0" onClick={() => setSubmissionTypeFilter(filter)}>
                  {filter === "all" ? `All (${submissionStats.total})` : filter === "post" ? `Posts (${submissionStats.posts})` : `Comments (${submissionStats.comments})`}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {(["all", "pending", "approved", "rejected"] as const).map((filter) => (
              <Button key={filter} size="sm" variant={submissionStatusFilter === filter ? "secondary" : "ghost"} className="shrink-0" onClick={() => setSubmissionStatusFilter(filter)}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== "all" ? ` (${submissionStats[filter]})` : ` (${submissionStats.total})`}
              </Button>
            ))}
          </div>

          {visibleSubmissions.map((s) => (
            <div key={s.id} className="panel space-y-3 p-4 transition-colors hover:border-primary/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {s.missions?.type === "post" ? <FileText className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-medium">{s.missions?.title ?? "Mission"}</div>
                      <Badge variant="outline" className="capitalize">{s.missions?.type ?? "mission"}</Badge>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {s.profile?.full_name || "Unknown worker"} · {s.profile?.email} · Submitted {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-primary">${Number(s.amount).toFixed(0)}</span>
                  <Badge variant={s.status === "pending" ? "secondary" : s.status === "approved" ? "default" : "destructive"}>
                    {s.status === "pending" ? "Pending" : s.status === "approved" ? "Approved" : "Rejected"}
                  </Badge>
                </div>
              </div>
              <a href={s.submitted_url} target="_blank" rel="noopener noreferrer" className="block break-all rounded-md border border-border bg-background/40 px-3 py-2 text-xs text-primary hover:underline">
                {s.submitted_url}
              </a>
              <div className="flex flex-wrap items-center gap-2">
                {s.status === "pending" ? <>
                  <Button size="sm" onClick={() => reviewSubmission(s.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => reviewSubmission(s.id, "rejected")}>Reject</Button>
                </> : null}
                {s.status === "approved" && !s.paid ? <Button size="sm" variant="outline" onClick={() => markPaid(s.id)}>Mark as paid</Button> : null}
                {s.paid ? <span className="text-xs text-success">Paid</span> : null}
              </div>
            </div>
          ))}
          {!visibleSubmissions.length ? <div className="panel p-8 text-center text-sm text-muted-foreground">No submissions match these filters.</div> : null}
        </TabsContent>

        <TabsContent value="users" className="mt-6 grid gap-3">
          <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email or Reddit profile"
              className="max-w-none sm:max-w-xs"
            />
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={userFilter === f ? "default" : "outline"}
                  onClick={() => setUserFilter(f)}
                  className="shrink-0"
                >
                  {f === "all" ? `All (${profileStats.total})` : f === "pending" ? `Pending (${profileStats.pending})` : f === "accepted" ? `Accepted (${profileStats.accepted})` : `Rejected (${profileStats.rejected})`}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {(["all", "yes", "no"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={submittedFilter === f ? "default" : "outline"}
                  onClick={() => setSubmittedFilter(f)}
                  className="shrink-0"
                >
                  {f === "all"
                    ? "Any activity"
                    : f === "yes"
                      ? `Has submitted (${(profiles ?? []).filter((p) => activity.has(p.id)).length})`
                      : `Never submitted (${(profiles ?? []).filter((p) => !activity.has(p.id)).length})`}
                </Button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground sm:ml-auto">
              Showing {visibleProfiles.length} of {profileStats.total}
            </span>
          </div>

          {visibleProfiles.map((p) => {
            const act = activity.get(p.id);
            return (
              <div key={p.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.full_name || "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.email}</div>
                  <a
                    href={p.reddit_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-primary hover:underline"
                  >
                    {p.reddit_profile_url}
                  </a>
                  <div className="truncate text-xs text-muted-foreground">Wallet: {p.wallet_address || "not set"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    WhatsApp: {p.phone_number || "not set"}
                  </div>
                  {p.niches?.length ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Topics:</span>
                      {p.niches.map((n) => (
                        <Badge key={n} variant="secondary" className="text-[10px]">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Topics: none
                    </div>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">Joined {fmtDate(p.created_at)}</div>
                  {act ? (
                    <div className="text-xs text-muted-foreground">
                      Last mission {fmtDate(act.last.created_at)} —{" "}
                      <span className="text-foreground">{act.last.missions?.title ?? "Mission"}</span>{" "}
                      <span
                        className={
                          act.last.status === "approved"
                            ? "text-success"
                            : act.last.status === "rejected"
                              ? "text-destructive"
                              : ""
                        }
                      >
                        ({act.last.status})
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No mission yet</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {act?.approved ?? 0} approved · ${(act?.earned ?? 0).toFixed(2)} earned ·{" "}
                    {act?.total ?? 0} submission{(act?.total ?? 0) > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant={act ? "default" : "outline"} className={act ? "" : "text-muted-foreground"}>
                    {act ? `Has submitted (${act.total})` : "Never submitted"}
                  </Badge>
                  <Badge variant={p.status === "accepted" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                    {p.status === "accepted" ? "Accepted" : p.status === "rejected" ? "Rejected" : "Pending"}
                  </Badge>
                  <Button size="sm" onClick={() => setAccountStatus(p.id, "accepted")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAccountStatus(p.id, "rejected")}>
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
          {!visibleProfiles.length ? (
            <div className="panel p-8 text-center text-sm text-muted-foreground">No member found.</div>
          ) : null}
        </TabsContent>

      </Tabs>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Edit mission" : draft?.type === "post" ? "New post mission" : "New comment mission"}
            </DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <FieldInput label="Mission name" value={draft.title ?? ""} onChange={(v) => setDraft({ ...draft, title: v })} />
              {draft.type === "post" ? (
                <FieldInput
                  label="Community link"
                  value={draft.community_url ?? ""}
                  onChange={(v) => setDraft({ ...draft, community_url: v })}
                  placeholder="https://www.reddit.com/r/..."
                />
              ) : (
                <FieldInput
                  label="Reddit post link"
                  value={draft.target_post_url ?? ""}
                  onChange={(v) => setDraft({ ...draft, target_post_url: v })}
                  placeholder="https://www.reddit.com/r/.../comments/..."
                />
              )}
              <FieldInput label="Payout ($)" type="number" value={String(draft.payout ?? "")} onChange={(v) => setDraft({ ...draft, payout: Number(v) })} />

              {draft.type === "post" ? (
                <>
                  <FieldInput label="Exact post title" value={draft.post_title ?? ""} onChange={(v) => setDraft({ ...draft, post_title: v })} />
                  <FieldArea label="Full body" value={draft.post_body ?? ""} onChange={(v) => setDraft({ ...draft, post_body: v })} />
                  <FieldInput label="Flair" value={draft.flair ?? ""} onChange={(v) => setDraft({ ...draft, flair: v })} />
                </>
              ) : (
                <FieldArea label="Exact comment" value={draft.comment_text ?? ""} onChange={(v) => setDraft({ ...draft, comment_text: v })} />
              )}
              <FieldArea label="Specific instructions" value={draft.instructions ?? ""} onChange={(v) => setDraft({ ...draft, instructions: v })} />
              <Button className="w-full" onClick={saveMission}>
                Save
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={300}
      />
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} maxLength={5000} />
    </div>
  );
}

type MetricTone = "neutral" | "warning" | "success" | "destructive";

function StatusMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: MetricTone;
}) {
  const toneClasses: Record<MetricTone, { icon: string; value: string; border: string }> = {
    neutral: { icon: "text-primary", value: "text-foreground", border: "border-border" },
    warning: { icon: "text-warning", value: "text-warning", border: "border-warning/30" },
    success: { icon: "text-success", value: "text-success", border: "border-success/30" },
    destructive: { icon: "text-destructive", value: "text-destructive", border: "border-destructive/30" },
  };
  const colors = toneClasses[tone];

  return (
    <div className={`panel relative overflow-hidden p-4 ${colors.border}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${colors.icon}`} aria-hidden />
      </div>
      <div className={`mt-2 font-display text-3xl font-bold ${colors.value}`}>{value}</div>
    </div>
  );
}

type SubmissionMetricTone = "primary" | "neutral" | "warning";

function SubmissionMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detail: string;
  tone: SubmissionMetricTone;
}) {
  const toneClasses: Record<SubmissionMetricTone, { icon: string; value: string; border: string }> = {
    primary: { icon: "text-primary", value: "text-primary", border: "border-primary/30" },
    neutral: { icon: "text-muted-foreground", value: "text-foreground", border: "border-border" },
    warning: { icon: "text-warning", value: "text-warning", border: "border-warning/30" },
  };
  const colors = toneClasses[tone];

  return (
    <div className={`panel relative overflow-hidden p-4 ${colors.border}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${colors.icon}`} aria-hidden />
      </div>
      <div className={`mt-2 font-display text-3xl font-bold ${colors.value}`}>{value}</div>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
