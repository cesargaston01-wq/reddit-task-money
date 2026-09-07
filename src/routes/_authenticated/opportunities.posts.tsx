import { createFileRoute } from "@tanstack/react-router";
import { CommunityHistory } from "@/components/community-history";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OpportunityList } from "@/components/opportunity-list";

export const Route = createFileRoute("/_authenticated/opportunities/posts")({
  head: () => ({
    meta: [
      { title: "Post opportunities — TaskReddit" },
      { name: "description", content: "Paid Reddit post missions rewarded $5 each." },
    ],
  }),
  component: () => (
    <DashboardLayout
      title="Post opportunities"
      description="A mission disappears as soon as a member submits it. $5 per approved post."
    >
      <OpportunityList type="post" />
      <CommunityHistory className="mt-10" />
    </DashboardLayout>
  ),
});
