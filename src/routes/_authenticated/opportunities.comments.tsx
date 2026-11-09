import { createFileRoute } from "@tanstack/react-router";
import { CommunityHistory } from "@/components/community-history";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OpportunityList } from "@/components/opportunity-list";

export const Route = createFileRoute("/_authenticated/opportunities/comments")({
  head: () => ({
    meta: [
      { title: "Comment opportunities — TaskReddit" },
      { name: "description", content: "Paid Reddit comment missions rewarded $3.50 each." },
      { property: "og:title", content: "Comment opportunities — TaskReddit" },
      { property: "og:description", content: "Browse and reserve paid Reddit comment missions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <DashboardLayout
      title="Comment opportunities"
      description="A mission disappears as soon as a member submits it. $3.50 per approved comment."
    >
      <OpportunityList type="comment" />
      <CommunityHistory className="mt-10" />
    </DashboardLayout>
  ),
});
