import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityHistory } from "@/components/community-history";
import { MissionBrowser } from "@/components/opportunity-list";
import { useProfile, useSession } from "@/lib/data";

export const Route = createFileRoute("/discover")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Discover paid tasks — TaskReddit" },
      {
        name: "description",
        content:
          "Browse every available Reddit comment mission for free: $3 per approved comment, with full read-only instructions.",
      },
      { property: "og:title", content: "Discover paid tasks — TaskReddit" },
      {
        property: "og:description",
        content: "All open Reddit comment opportunities: $3 per approved comment.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://reddit-task-money.lovable.app/discover" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://reddit-task-money.lovable.app/discover" }],
  }),

  component: DiscoverPage,
});

function DiscoverPage() {
  const { data: user } = useSession();
  const { data: profile } = useProfile();
  const canSubmit = profile?.status === "accepted";


  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5">
          <Link to="/" className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
            Task<span className="text-primary">Reddit</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/discover">Discover paid tasks</Link>
            </Button>
            <Button asChild size="sm" className="px-3">
              <Link to={user ? "/opportunities/comments" : "/auth"}>
                <span className="sm:hidden">{user ? "Dashboard" : "Get started"}</span>
                <span className="hidden sm:inline">{user ? "Go to dashboard" : "Start earning money"}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

      </header>

      <main className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Discover paid tasks</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Every open mission, read-only. A verified Reddit account is required to take one.
        </p>


        {!canSubmit ? (
          <div className="panel mt-6 p-4 text-sm text-muted-foreground">
            You're browsing missions in read-only mode.{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Sign in with a verified account to apply
            </Link>
            .
          </div>
        ) : null}

        <div className="mt-6">
          <MissionBrowser type="comment" canSubmit={canSubmit} />
        </div>

        <CommunityHistory className="mt-14" />
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} TaskReddit — Paid Reddit missions.
        </div>
      </footer>
    </div>
  );
}
