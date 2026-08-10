import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import HowItWorks from "@/components/ui/how-it-works";
import OrbitingReddit from "@/components/ui/orbiting-reddit";



import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WHOP_COMMUNITY_URL } from "@/lib/community";
import { useSession } from "@/lib/data";
const taskredditLogoAsset = { url: "/taskreddit-logo.png" };

const SITE_URL = "https://reddit-task-money.lovable.app";

const faqs = [
  {
    q: "Who publishes the missions?",
    a: "For now, every mission is published by the TaskReddit team. Opening it up to companies will come in a future version.",
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
];

const HOME_TITLE = "Get paid for Reddit posts & comments — TaskReddit";
const HOME_DESCRIPTION =
  "TaskReddit pays $5 per approved Reddit post and $3 per approved comment. Verified accounts pick missions and get paid in crypto.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
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
  { icon: Calendar, title: "3 months old", text: "The account must be at least 3 months old." },
  { icon: Zap, title: "100+ karma", text: "Combined post or comment karma." },
  { icon: ShieldCheck, title: "Quality account", text: "Natural history, no spam and no bans." },
];

function Landing() {
  const { data: user } = useSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-base font-bold tracking-tight sm:text-lg">
            <img src={taskredditLogoAsset.url} alt="TaskReddit logo" className="h-7 w-7 shrink-0" width={28} height={28} />
            <span className="truncate">
              Task<span className="text-primary">Reddit</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/discover">Discover paid tasks</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
              <a href={WHOP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
                Community
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <a href="mailto:cesar@skilfut.com?subject=Post%20a%20listing%20on%20TaskReddit">
                Post a listing
              </a>
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
                src={taskredditLogoAsset.url}
                alt="TaskReddit mascot"
                className="relative mx-auto w-40 drop-shadow-[0_25px_60px_rgba(255,69,0,0.35)] sm:w-56 md:w-72"
                width={288}
                height={288}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />

              <div className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                <div className="panel elevated p-4 text-left sm:p-5">

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> Post mission
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">$5</div>
                  <p className="mt-1 text-xs text-muted-foreground">per approved post</p>
                </div>
                <div className="panel elevated p-4 text-left sm:p-5">
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


        <section className="relative overflow-hidden border-y border-border/60 bg-surface/30 py-20">
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" aria-hidden />

          <div className="relative mx-auto max-w-3xl px-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Security Standard
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Quality <span className="text-primary">requirements</span>
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Every account is reviewed manually before getting access to missions.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {criteria.map((c) => (
                <div
                  key={c.title}
                  className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 sm:gap-5 sm:p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                    <c.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground">{c.title}</h3>
                    <p className="text-sm text-muted-foreground">{c.text}</p>
                  </div>
                  <div className="ml-auto opacity-20 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Built for Reddit creators</h2>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              Everything you need to turn your Reddit account into a reliable side income.
            </p>
          </div>
        <FeaturesSectionWithHoverEffects />
      </section>

        <section className="border-y border-border/60 bg-surface/30">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="text-2xl font-bold md:text-3xl">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-6">
              {faqs.map((item, i) => (

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

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={taskredditLogoAsset.url} alt="" className="h-4 w-4 opacity-80" width={16} height={16} />
            © {new Date().getFullYear()} TaskReddit — Paid Reddit missions.
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/discover" className="transition-colors hover:text-foreground">
              Discover paid tasks
            </Link>
            <a
              href="mailto:cesar@skilfut.com"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              cesar@skilfut.com
            </a>
          </div>
        </div>
      </footer>


    </div>
  );
}
