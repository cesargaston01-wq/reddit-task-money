import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OpportunityList } from "@/components/opportunity-list";

export const Route = createFileRoute("/_authenticated/opportunites/posts")({
  head: () => ({
    meta: [
      { title: "Opportunités Posts — KarmaWork" },
      { name: "description", content: "Missions de publication Reddit rémunérées 5 $." },
    ],
  }),
  component: () => (
    <DashboardLayout
      title="Opportunités Posts"
      description="Une mission disparaît dès qu'un membre la soumet. 5 $ par publication validée."
    >
      <OpportunityList type="post" />
    </DashboardLayout>
  ),
});
