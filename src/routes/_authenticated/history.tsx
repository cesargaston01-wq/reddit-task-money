import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useMySubmissions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/historique")({
  head: () => ({
    meta: [
      { title: "Historique — KarmaWork" },
      { name: "description", content: "Suivez l'état de vos missions Reddit soumises." },
    ],
  }),
  component: HistoryPage,
});

export function statusBadge(status: string) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground">Validé</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Refusé</Badge>;
  return <Badge variant="secondary">En attente</Badge>;
}

function HistoryPage() {
  const { data, isLoading } = useMySubmissions();

  return (
    <DashboardLayout title="Historique" description="Toutes vos missions soumises.">
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : !data?.length ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">
          Vous n'avez encore soumis aucune mission.
        </div>
      ) : (
        <div className="grid gap-3">
          {data.map((s) => (
            <div key={s.id} className="panel flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{s.missions?.title ?? "Mission"}</h3>
                <a
                  href={s.submitted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-primary hover:underline"
                >
                  {s.submitted_url}
                </a>
                {s.admin_note ? (
                  <p className="mt-1 text-xs text-muted-foreground">Note : {s.admin_note}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold">{Number(s.amount).toFixed(0)} $</span>
                {statusBadge(s.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
