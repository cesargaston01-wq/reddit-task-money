import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OpportunityList } from "@/components/opportunity-list";

export const Route = createFileRoute("/_authenticated/opportunites/commentaires")({
  head: () => ({
    meta: [
      { title: "Opportunités Commentaires — KarmaWork" },
      { name: "description", content: "Missions de commentaires Reddit rémunérées 3 $." },
    ],
  }),
  component: () => (
    <DashboardLayout
      title="Opportunités Commentaires"
      description="Une mission disparaît dès qu'un membre la soumet. 3 $ par commentaire validé."
    >
      <OpportunityList type="comment" />
    </DashboardLayout>
  ),
});
