"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  IconBrandReddit,
  IconCalendar,
  IconCoin,
  IconEyeCheck,
  IconLock,
  IconMessageCircle,
  IconRosetteDiscountCheck,
  IconWallet,
} from "@tabler/icons-react";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: "Built for Reddit creators",
    description:
      "Every mission is designed around real Reddit communities. Post or comment where it actually makes sense.",
    icon: <IconBrandReddit className="h-6 w-6" />,
  },
  {
    title: "Fixed payouts",
    description:
      "No negotiation, no surprises. $5 for every approved post and $3 for every approved comment.",
    icon: <IconCoin className="h-6 w-6" />,
  },
  {
    title: "Daily account protection",
    description:
      "Automatic caps keep your account safe: 1 post and 3 comments per day, per Reddit profile.",
    icon: <IconCalendar className="h-6 w-6" />,
  },
  {
    title: "10-minute reservation lock",
    description:
      "When you take a mission, it is reserved for you alone. No one else can claim it while you work.",
    icon: <IconLock className="h-6 w-6" />,
  },
  {
    title: "Manual quality, fair validation",
    description:
      "Our team checks every submission. Once approved and online for 3 hours, your payout is queued.",
    icon: <IconEyeCheck className="h-6 w-6" />,
  },
  {
    title: "USDC on Ethereum",
    description:
      "Add your ERC-20 wallet in your profile. Payments are sent manually in USDC on the Ethereum blockchain.",
    icon: <IconWallet className="h-6 w-6" />,
  },
  {
    title: "Verified-only access",
    description:
      "Only accepted accounts can take missions. We review age, karma and history to protect the platform.",
    icon: <IconRosetteDiscountCheck className="h-6 w-6" />,
  },
  {
    title: "Clear instructions only",
    description:
      "Follow the mission text and community flair exactly. Edited or off-topic submissions are rejected.",
    icon: <IconMessageCircle className="h-6 w-6" />,
  },
];

export function FeaturesSectionWithHoverEffects({
  className,
}: {
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 py-10 md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {FEATURES.map((feature, index) => (
        <Feature
          key={feature.title}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          index={index}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      ))}
    </div>
  );
}

function Feature({
  title,
  description,
  icon,
  index,
  hoveredIndex,
  setHoveredIndex,
}: Feature & {
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}) {
  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && hoveredIndex !== index;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/40 p-6 transition-all duration-300",
        isHovered && "scale-[1.02] border-primary/40 bg-surface/80 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.3)]",
        isDimmed && "scale-[0.98] opacity-60",
      )}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-300",
          isHovered && "bg-primary text-primary-foreground",
        )}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold leading-snug">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {index < 4 && (
        <div
          className={cn(
            "absolute -bottom-px -right-px h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {index >= 4 && (
        <div
          className={cn(
            "absolute -top-px -left-px h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}

export default FeaturesSectionWithHoverEffects;
