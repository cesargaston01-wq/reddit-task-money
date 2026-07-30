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
      { title: "KarmaWork — Monetize your Reddit account" },
      {
        name: "description",
        content:
          "Earn money with your Reddit account: publish posts ($5) and comments ($3) in relevant communities. Paid in crypto.",
      },
      { property: "og:title", content: "KarmaWork — Monetize your Reddit account" },
      {
        property: "og:description",
        content: "Earn money with your Reddit account: publish posts ($5) and comments ($3) in relevant communities. Paid in crypto.",
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
    title: "Create your account",
    text: "Sign up with your Reddit profile. It takes less than a minute.",
  },
  {
    n: "02",
    title: "Get your account verified",
    text: "We manually review the age, karma and overall quality of your Reddit account.",
  },
  {
    n: "03",
    title: "Complete missions",
    text: "Pick a mission, publish it, submit your link. Paid in crypto once approved.",
  },
];

const criteria = [
  { icon: Clock, title: "3 months old", text: "The account must be at least 3 months old." },
  { icon: Sparkles, title: "100+ karma", text: "Combined post or comment karma." },
  
  { icon: ShieldCheck, title: "Quality account", text: "Natural history, no spam and no bans." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            Karma<span className="text-primary">Work</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/discover">Discover paid tasks</Link>
            </Button>
            <Button variant="ghost" size="sm" disabled title="Coming soon" className="hidden sm:inline-flex">
              Post a listing
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">
                Start earning money<ArrowRight className="ml-1 h-4 w-4" />
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
              Missions paid in crypto, no admin delays
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.05] md:text-6xl">
              Earn money with your Reddit account
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Publish posts and comments in relevant communities. Clear missions, exact
              instructions, a fixed payout.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Start earning money<ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" disabled title="Coming soon">
                Post a listing
              </Button>
            </div>

            <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
              <div className="panel elevated p-6 text-left">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Post mission
                </div>
                <div className="mt-3 font-display text-4xl font-bold">$5</div>
                <p className="mt-1 text-sm text-muted-foreground">per approved post</p>
              </div>
              <div className="panel elevated p-6 text-left">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" /> Comment mission
                </div>
                <div className="mt-3 font-display text-4xl font-bold">$3</div>
                <p className="mt-1 text-sm text-muted-foreground">per approved comment</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-2xl font-bold md:text-3xl">How it works</h2>
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
              <h2 className="text-2xl font-bold md:text-3xl">Quality requirements</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Every account is reviewed manually before getting access to missions.
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
              <h2 className="text-2xl font-bold md:text-3xl">How much can you earn?</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Earnings depend on how many missions are available and how fast you are. A mission
                is locked as soon as it's submitted: first come, first served.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "5 post missions per week → $25",
                  "10 comments per week → $30",
                  "No cap: it all depends on the open missions",
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
              <h3 className="mt-4 text-xl font-semibold">Crypto payments</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add your wallet from your profile page. Once a mission is approved (publication kept
                online for at least 3 hours), the payment is sent manually to your address.
              </p>
              <div className="mt-6 rounded-lg border border-border bg-background/60 p-4 text-xs text-muted-foreground">
                By participating, you agree not to delete your publications after being paid.
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/30">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="text-2xl font-bold md:text-3xl">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-6">
              {[
                {
                  q: "Who publishes the missions?",
                  a: "For now, every mission is published by the KarmaWork team. Opening it up to companies will come in a future version.",
                },
                {
                  q: "When do I get paid?",
                  a: "After your publication is reviewed and has been online for at least 3 hours. The payment is then sent to your crypto wallet.",
                },
                {
                  q: "Can I delete my publication?",
                  a: "No. Publications must stay online. Deleting a post after being paid results in your future missions being refused.",
                },
                {
                  q: "What happens if my account is rejected?",
                  a: "You get the reason in your dashboard. You can re-apply with an account that meets the requirements.",
                },
                {
                  q: "Can several people do the same mission?",
                  a: "No. As soon as a mission is submitted, it automatically disappears for everyone else.",
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
          <h2 className="text-3xl font-bold md:text-4xl">Ready to monetize your karma?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Free sign-up. Manual review within 48 hours.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth">
              Start earning money<ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} KarmaWork — Paid Reddit missions.
        </div>
      </footer>
    </div>
  );
}
