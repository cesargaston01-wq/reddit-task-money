import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KarmaWork — Monétisez votre compte Reddit" },
      {
        name: "description",
        content:
          "Gagnez de l'argent avec votre compte Reddit : publiez des posts (5 $) et des commentaires (3 $) sur des communautés pertinentes. Paiement en crypto.",
      },
      { property: "og:title", content: "KarmaWork — Monétisez votre compte Reddit" },
      {
        property: "og:description",
        content:
          "Missions Reddit rémunérées : 5 $ par post, 3 $ par commentaire. Comptes de qualité uniquement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    n: "01",
    title: "Créez votre compte",
    text: "Inscrivez-vous avec votre profil Reddit et votre wallet crypto. Cela prend moins d'une minute.",
  },
  {
    n: "02",
    title: "Faites valider votre compte",
    text: "Nous vérifions manuellement l'ancienneté, le karma et la qualité générale de votre compte Reddit.",
  },
  {
    n: "03",
    title: "Réalisez des missions",
    text: "Choisissez une mission, publiez, soumettez votre lien. Paiement en crypto après validation.",
  },
];

const criteria = [
  { icon: Clock, title: "3 mois d'ancienneté", text: "Le compte doit avoir au moins 3 mois." },
  { icon: Sparkles, title: "100 de karma minimum", text: "Post ou commentaire karma cumulé." },
  { icon: BadgeCheck, title: "Avatar configuré", text: "Un profil complet et crédible." },
  { icon: ShieldCheck, title: "Compte de qualité", text: "Historique naturel, sans spam ni bans." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Karma<span className="text-primary">Work</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled title="Bientôt disponible">
              Poster une annonce
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Commencer à gagner<ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-surface border-b border-border/60">
          <div className="mx-auto max-w-6xl px-5 py-24 text-center md:py-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Missions payées en crypto, sans délai administratif
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl">
              Gagnez de l'argent avec votre compte Reddit
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Publiez des posts et des commentaires sur des communautés pertinentes. Des missions
              claires, des consignes exactes, un paiement fixe.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Commencer à gagner<ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" disabled title="Bientôt disponible">
                Poster une annonce
              </Button>
            </div>

            <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
              <div className="panel elevated p-6 text-left">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Mission Post
                </div>
                <div className="mt-3 font-display text-4xl font-bold">5 $</div>
                <p className="mt-1 text-sm text-muted-foreground">par publication validée</p>
              </div>
              <div className="panel elevated p-6 text-left">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" /> Mission Commentaire
                </div>
                <div className="mt-3 font-display text-4xl font-bold">3 $</div>
                <p className="mt-1 text-sm text-muted-foreground">par commentaire validé</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-2xl font-bold md:text-3xl">Comment ça marche</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="panel p-6">
                <span className="font-display text-sm font-bold text-primary">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/30">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold md:text-3xl">Critères d'acceptation</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Chaque compte est vérifié manuellement avant d'accéder aux missions.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {criteria.map((c) => (
                <div key={c.title} className="panel p-6">
                  <c.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Combien pouvez-vous gagner ?</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Les gains dépendent du nombre de missions disponibles et de votre réactivité. Une
                mission est réservée dès qu'elle est soumise : premier arrivé, premier servi.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "5 missions post par semaine → 25 $",
                  "10 commentaires par semaine → 30 $",
                  "Aucun plafond : tout dépend des missions ouvertes",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel elevated p-8">
              <Wallet className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">Paiements en crypto</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Renseignez votre wallet à l'inscription. Après validation d'une mission (publication
                maintenue au moins 3 heures), le paiement est envoyé manuellement sur votre adresse.
              </p>
              <div className="mt-6 rounded-lg border border-border bg-background/60 p-4 text-xs text-muted-foreground">
                En participant, vous acceptez de ne pas supprimer vos publications après paiement.
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/30">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="text-2xl font-bold md:text-3xl">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="mt-6">
              {[
                {
                  q: "Qui publie les missions ?",
                  a: "Pour l'instant, toutes les missions sont publiées par l'équipe KarmaWork. L'ouverture aux entreprises viendra dans une prochaine version.",
                },
                {
                  q: "Quand suis-je payé ?",
                  a: "Après vérification de votre publication et un délai minimum de 3 heures de mise en ligne. Le paiement est ensuite envoyé sur votre wallet crypto.",
                },
                {
                  q: "Puis-je supprimer ma publication ?",
                  a: "Non. Les publications doivent rester en ligne. Supprimer un post après paiement entraîne un refus des missions suivantes.",
                },
                {
                  q: "Que se passe-t-il si mon compte est refusé ?",
                  a: "Vous recevez le motif dans votre espace. Vous pouvez repostuler avec un compte qui remplit les critères.",
                },
                {
                  q: "Plusieurs personnes peuvent-elles faire la même mission ?",
                  a: "Non. Dès qu'une mission est soumise, elle disparaît automatiquement pour tous les autres membres.",
                },
              ].map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-24 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Prêt à monétiser votre karma ?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Inscription gratuite. Validation manuelle sous 48h.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth">
              Commencer à gagner<ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} KarmaWork — Missions Reddit rémunérées.
        </div>
      </footer>
    </div>
  );
}
