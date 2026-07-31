import { TrendingUp, Users, Wallet, Rocket } from "lucide-react";

const stats = [
  {
    icon: Rocket,
    value: "300+",
    label: "Missions published monthly",
    description: "New opportunities are added every week across targeted communities.",
  },
  {
    icon: Wallet,
    value: "$25K+",
    label: "Already paid out",
    description: "Manually sent in crypto to verified contributors around the world.",
  },
  {
    icon: Users,
    value: "500+",
    label: "Reddit accounts earning daily",
    description: "Active users monetizing their accounts with posts and comments.",
  },
  {
    icon: TrendingUp,
    value: "$5 / $3",
    label: "Fixed payout per mission",
    description: "Transparent pricing: $5 per approved post, $3 per approved comment.",
  },
];

export const BoldStats = () => {
  return (
    <section className="border-y border-border/60 bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Built for Reddit creators</h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            A growing marketplace where real accounts get paid for real engagement.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="panel elevated flex flex-col p-6 text-center transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="mx-flex mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-medium text-foreground">{stat.label}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BoldStats;
