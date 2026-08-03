"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  IconCoin,
  IconRocket,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";

interface Feature {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    value: "300+",
    label: "Missions published monthly",
    description:
      "New opportunities are added every week across targeted communities.",
    icon: <IconRocket className="h-6 w-6" />,
  },
  {
    value: "$25K+",
    label: "Already paid out",
    description:
      "Manually sent in crypto to verified contributors around the world.",
    icon: <IconWallet className="h-6 w-6" />,
  },
  {
    value: "500+",
    label: "Reddit accounts earning daily",
    description:
      "Active users monetizing their accounts with posts and comments.",
    icon: <IconUsers className="h-6 w-6" />,
  },
  {
    value: "$5 / $3",
    label: "Fixed payout per mission",
    description:
      "Transparent pricing: $5 per approved post, $3 per approved comment.",
    icon: <IconCoin className="h-6 w-6" />,
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
          key={feature.label}
          value={feature.value}
          label={feature.label}
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
  value,
  label,
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
      <div className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <h3 className="mt-1 text-base font-semibold leading-snug">{label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div
        className={cn(
          "absolute -bottom-px -right-px h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export default FeaturesSectionWithHoverEffects;
