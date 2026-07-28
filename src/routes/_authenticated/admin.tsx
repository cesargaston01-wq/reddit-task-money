import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
      { title: "Administration — KarmaWork" },
      { name: "description", content: "Manage missions, submissions and Reddit accounts." },
    ],
  }),
  component: AdminPage,
});

type Draft = Partial<Mission> & { type: "post" | "comment" };

function AdminPage() {
  const { data: isAdmin, isLoading: loadingRole } = useIsAdmin();
  const qc = useQueryClient();
  const { data: missions } = useAllMissions();
  const { data: submissions } = useAllSubmissions();
  const { data: profiles } = useAllProfiles();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

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

  const activity = new Map<
    string,
    { last: (typeof submissions extends undefined ? never : NonNullable<typeof submissions>)[number]; approved: number; earned: number; total: number }
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
      !query
        ? true
        : `${p.full_name} ${p.email} ${p.reddit_profile_url}`.toLowerCase().includes(query),
    )
    .sort((a, b) => {
      const la = activity.get(a.id)?.last.created_at;
      const lb = activity.get(b.id)?.last.created_at;
      if (la && lb) return new Date(lb).getTime() - new Date(la).getTime();
      if (la) return -1;
      if (lb) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });



  async function saveMission() {
    if (!draft) return;
    const payload = {
      type: draft.type,
      title: (draft.title ?? "").trim(),
      subreddit: (draft.subreddit ?? "").trim().replace(/^r\//, ""),
      community_url: draft.community_url ?? "",
      payout: Number(draft.payout ?? (draft.type === "post" ? 5 : 3)),
      estimated_minutes: Number(draft.estimated_minutes ?? 10),
      difficulty: draft.difficulty ?? "Easy",
      post_title: draft.post_title ?? null,
      post_body: draft.post_body ?? null,
      flair: draft.flair ?? null,
      instructions: draft.instructions ?? null,
      target_post_url: draft.target_post_url ?? null,
      comment_text: draft.comment_text ?? null,
      is_active: draft.is_active ?? true,
    };
    if (!payload.title || !payload.subreddit) return toast.error("Title and community are required.");

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
      <Tabs defaultValue="missions">
        <TabsList>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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

        <TabsContent value="submissions" className="mt-6 grid gap-3">
          {(submissions ?? []).map((s) => (
            <div key={s.id} className="panel space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.missions?.title ?? "Mission"}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.profile?.full_name} · {s.profile?.email} · ${Number(s.amount).toFixed(0)}
                  </div>
                </div>
                <Badge variant={s.status === "pending" ? "secondary" : s.status === "approved" ? "default" : "destructive"}>
                  {s.status === "pending" ? "Pending" : s.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </div>
              <a
                href={s.submitted_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-xs text-primary hover:underline"
              >
                {s.submitted_url}
              </a>
              <div className="flex flex-wrap gap-2">
                {s.status === "pending" ? (
                  <>
                    <Button size="sm" onClick={() => reviewSubmission(s.id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reviewSubmission(s.id, "rejected")}>
                      Reject
                    </Button>
                  </>
                ) : null}
                {s.status === "approved" && !s.paid ? (
                  <Button size="sm" variant="outline" onClick={() => markPaid(s.id)}>
                    Mark as paid
                  </Button>
                ) : null}
                {s.paid ? <span className="text-xs text-success">Paid</span> : null}
              </div>
            </div>
          ))}
          {!submissions?.length ? (
            <div className="panel p-8 text-center text-sm text-muted-foreground">No submission yet.</div>
          ) : null}
        </TabsContent>

        <TabsContent value="users" className="mt-6 grid gap-3">
          {(profiles ?? []).map((p) => (
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
                <div className="truncate text-xs text-muted-foreground">Wallet: {p.wallet_address}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
          ))}
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
              <FieldInput label="Community (without r/)" value={draft.subreddit ?? ""} onChange={(v) => setDraft({ ...draft, subreddit: v })} />
              <FieldInput label="Community link" value={draft.community_url ?? ""} onChange={(v) => setDraft({ ...draft, community_url: v })} />
              <div className="grid grid-cols-3 gap-3">
                <FieldInput label="Payout ($)" type="number" value={String(draft.payout ?? "")} onChange={(v) => setDraft({ ...draft, payout: Number(v) })} />
                <FieldInput label="Time (min)" type="number" value={String(draft.estimated_minutes ?? 10)} onChange={(v) => setDraft({ ...draft, estimated_minutes: Number(v) })} />
                <FieldInput label="Difficulty" value={draft.difficulty ?? "Easy"} onChange={(v) => setDraft({ ...draft, difficulty: v })} />
              </div>

              {draft.type === "post" ? (
                <>
                  <FieldInput label="Exact post title" value={draft.post_title ?? ""} onChange={(v) => setDraft({ ...draft, post_title: v })} />
                  <FieldArea label="Full body" value={draft.post_body ?? ""} onChange={(v) => setDraft({ ...draft, post_body: v })} />
                  <FieldInput label="Flair" value={draft.flair ?? ""} onChange={(v) => setDraft({ ...draft, flair: v })} />
                </>
              ) : (
                <>
                  <FieldInput label="Reddit post link" value={draft.target_post_url ?? ""} onChange={(v) => setDraft({ ...draft, target_post_url: v })} />
                  <FieldArea label="Exact comment" value={draft.comment_text ?? ""} onChange={(v) => setDraft({ ...draft, comment_text: v })} />
                </>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={300} />
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
