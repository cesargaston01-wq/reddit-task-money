import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissionBrowser } from "@/components/opportunity-list";
import { useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/decouvrir")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Découvrir les tâches rémunérées — KarmaWork" },
      {
        name: "description",
        content:
          "Parcourez librement toutes les missions Reddit disponibles : posts rémunérés 5 $ et commentaires 3 $, consignes complètes en lecture seule.",
      },
      { property: "og:title", content: "Découvrir les tâches rémunérées — KarmaWork" },
      {
        property: "og:description",
        content: "Toutes les opportunités Reddit ouvertes : 5 $ par post, 3 $ par commentaire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const [tab, setTab] = useState<"post" | "comment">("post");
  const { data: profile } = useProfile();
  const canSubmit = profile?.status === "accepted";

  const tabs = [
    { key: "post" as const, label: "Opportunités post", icon: FileText, price: "5 $" },
    { key: "comment" as const, label: "Opportunités commentaire", icon: MessageSquare, price: "3 $" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Karma<span className="text-primary">Work</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/decouvrir">Découvrir les tâches rémunérées</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Commencer à gagner<ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="text-3xl font-bold md:text-4xl">Découvrir les tâches rémunérées</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Toutes les missions ouvertes, en lecture seule. Un compte Reddit vérifié est nécessaire
          pour en prendre une.
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
            Vous consultez les missions en lecture seule.{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Connecte-toi avec un compte vérifié pour postuler
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
          © {new Date().getFullYear()} KarmaWork — Missions Reddit rémunérées.
        </div>
      </footer>
    </div>
  );
}
