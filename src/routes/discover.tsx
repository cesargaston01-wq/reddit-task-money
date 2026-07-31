import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissionBrowser } from "@/components/opportunity-list";
import { useProfile, useSession } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Discover paid tasks — KarmaWork" },
      {
        name: "description",
        content:
          "Browse every available Reddit mission for free: paid posts at $5 and comments at $3, with full read-only instructions.",
      },
      { property: "og:title", content: "Discover paid tasks — KarmaWork" },
      {
        property: "og:description",
        content: "All open Reddit opportunities: $5 per post, $3 per comment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const [tab, setTab] = useState<"post" | "comment">("post");
  const { data: user } = useSession();
  const { data: profile } = useProfile();
  const canSubmit = profile?.status === "accepted";

  const tabs = [
    { key: "post" as const, label: "Post opportunities", icon: FileText, price: "$5" },
    { key: "comment" as const, label: "Comment opportunities", icon: MessageSquare, price: "$3" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5">
          <Link to="/" className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
            Karma<span className="text-primary">Work</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/discover">Discover paid tasks</Link>
            </Button>
            <Button asChild size="sm" className="px-3">
              <Link to={user ? "/opportunities/posts" : "/auth"}>
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

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                tab === t.key
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <span className="text-xs text-primary">{t.price}</span>
            </button>
          ))}
        </div>

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
          <MissionBrowser key={tab} type={tab} canSubmit={canSubmit} />
        </div>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} KarmaWork — Paid Reddit missions.
        </div>
      </footer>
    </div>
  );
}
