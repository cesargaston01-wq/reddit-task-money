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
import HowItWorks from "@/components/ui/how-it-works";
import OrbitingReddit from "@/components/ui/orbiting-reddit";
import { BoldStats } from "@/components/ui/stats-bold";


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSession } from "@/lib/data";
import redditLogo from "@/assets/reddit-logo.png.asset.json";

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
  const { data: user } = useSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-base font-bold tracking-tight sm:text-lg">
            <img src={redditLogo.url} alt="Reddit logo" className="h-7 w-7 shrink-0" width={28} height={28} />
            <span className="truncate">
              Karma<span className="text-primary">Work</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/discover">Discover paid tasks</Link>
            </Button>
            <Button variant="ghost" size="sm" disabled title="Coming soon" className="hidden md:inline-flex">
              Post a listing
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

      <main>
        <section className="hero-surface relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
          />
          <OrbitingReddit className="hidden opacity-30 md:block" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 md:grid-cols-2 md:py-28">
            <div className="text-center md:text-left">

              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Missions paid in crypto, no admin delays
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] md:text-6xl">
                Earn money with your <span className="text-primary">Reddit</span> account
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
                Publish posts and comments in relevant communities. Clear missions, exact
                instructions, a fixed payout.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Button asChild size="lg">
                  <Link to={user ? "/opportunities/posts" : "/auth"}>
                    {user ? "Go to dashboard" : "Start earning money"}<ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/discover">Discover paid tasks</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground md:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Manual review under 48h
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-primary" /> Crypto payouts
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div
                aria-hidden
                className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-primary/30 blur-[90px]"
              />
              <img
                src={redditLogo.url}
                alt="Reddit mascot"
                className="relative mx-auto w-56 drop-shadow-[0_25px_60px_rgba(255,69,0,0.35)] md:w-72"
                width={288}
                height={288}
              />
              <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
                <div className="panel elevated p-5 text-left">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> Post mission
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">$5</div>
                  <p className="mt-1 text-xs text-muted-foreground">per approved post</p>
                </div>
                <div className="panel elevated p-5 text-left">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" /> Comment mission
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">$3</div>
                  <p className="mt-1 text-xs text-muted-foreground">per approved comment</p>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-2xl font-bold md:text-3xl">How it works</h2>
          </div>
          <div className="mt-10">
            <HowItWorks
              features={steps.map((s, i) => ({
                title: s.title,
                description: s.text,
                colorTheme: (["orange", "blue", "purple"] as const)[i % 3],
              }))}
            />
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

        <BoldStats />

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
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 text-xs text-muted-foreground">
          <img src={redditLogo.url} alt="" className="h-4 w-4 opacity-80" width={16} height={16} />
          © {new Date().getFullYear()} KarmaWork — Paid Reddit missions.
        </div>
      </footer>

    </div>
  );
}
