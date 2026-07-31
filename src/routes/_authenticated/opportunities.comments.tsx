import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OpportunityList } from "@/components/opportunity-list";

export const Route = createFileRoute("/_authenticated/opportunities/comments")({
  head: () => ({
	"Comment opportunities — TaskReddit" },
      { name: "description", content: "Paid Reddit comment missions rewarded $3 each." },
    ],
  }),
  component: () => (
    <DashboardLayout
      title="Comment opportunities"
      description="A mission disappears as soon as a member submits it. $3 per approved comment."
    >
      <OpportunityList type="comment" />
    </DashboardLayout>
  ),
});
