"use client";

import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { cn } from "@/lib/utils";

interface CardProps {
  number: string;
  title: string;
  description: string;
  colorTheme?: "orange" | "blue" | "purple";
  className?: string;
  rotate?: string;
  colors?: {
    bg: string;
    text: string;
    border: string;
  };
}

const Pin = ({ className }: { className?: string }) => (
  <span className={cn("relative flex h-3 w-3", className)}>
    <span className="absolute inset-0 rounded-full bg-primary/40 blur-[3px]" />
    <span className="relative m-auto h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
  </span>
);

const Card = ({
  number,
  title,
  description,
  colorTheme = "blue",
  className,
  rotate,
  colors: customColors,
}: CardProps) => {
  const defaultBgColors = {
    orange: "bg-orange-500/10",
    blue: "bg-blue-500/10",
    purple: "bg-purple-500/10",
  };
  const defaultTextColors = {
    orange: "text-orange-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };
  const defaultBorderColors = {
    orange: "border-orange-500/20",
    blue: "border-blue-500/20",
    purple: "border-purple-500/20",
  };

  const bgColor = customColors?.bg || defaultBgColors[colorTheme];
  const textColor = customColors?.text || defaultTextColors[colorTheme];
  const borderColor = customColors?.border || defaultBorderColors[colorTheme];

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("w-full max-w-[340px]", className)}
    >
      <div
        className={cn(
          "panel elevated relative rounded-2xl border p-6 transition-transform duration-300 hover:rotate-0",
          borderColor,
          rotate,
        )}
      >
        <Pin className="absolute -top-1.5 left-6" />
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold",
            bgColor,
            textColor,
          )}
        >
          {number}
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </m.div>
  );
};

export interface Step {
  title: string;
  description: string;
  colorTheme?: "orange" | "blue" | "purple";
  colors?: {
    bg: string;
    text: string;
    border: string;
  };
}

export interface StepPosition {
  className?: string;
  rotate?: string;
}

export interface HowItWorksProps {
  features?: Step[];
  className?: string;
  stepPositions?: StepPosition[];
}

const DEFAULT_CARD_POSITIONS: StepPosition[] = [
  { className: "md:absolute md:top-0 md:left-[15%]", rotate: "rotate-2" },
  { className: "md:absolute md:top-[120px] md:right-[15%]", rotate: "-rotate-2" },
  { className: "md:absolute md:top-[450px] md:left-[15%]", rotate: "rotate-2" },
  { className: "md:absolute md:top-[570px] md:right-[10%]", rotate: "-rotate-2" },
  { className: "md:absolute md:top-[850px] md:left-[15%]", rotate: "rotate-2" },
];

export default function HowItWorks({ features, className, stepPositions }: HowItWorksProps) {
  const defaultFeatures: Step[] = [
    {
      title: "Create Account",
      description: "Sign up in minutes and connect your Reddit profile.",
      colorTheme: "orange",
    },
    {
      title: "Verify Identity",
      description: "We manually review your account age, karma and history.",
      colorTheme: "blue",
    },
    {
      title: "Complete missions",
      description: "Pick a mission, publish it and submit your link.",
      colorTheme: "purple",
    },
  ];

  const data = features && features.length > 0 ? features : defaultFeatures;
  const positions = stepPositions || DEFAULT_CARD_POSITIONS;

  let height = 1130;
  if (data.length === 1) height = 400;
  else if (data.length === 2) height = 450;
  else if (data.length === 3) height = 800;
  else if (data.length === 4) height = 900;

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn("relative mx-auto w-full max-w-6xl px-5", className)}>
        <div className="relative">
          <div
            className="relative flex flex-col items-center gap-6 md:block"
            style={{ minHeight: undefined }}
          >
            <div className="hidden md:block" style={{ height }} />

            {data.length > 1 && (
              <svg
                className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
                viewBox="0 0 1140 1130"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {(() => {
                  const pathD = data.reduce((acc, _, index) => {
                    if (index >= data.length - 1) return acc;
                    if (index === 0) return "M 290 150 C 500 150, 550 270, 710 270";
                    if (index === 1) return acc + " C 850 270, 500 350, 290 450";
                    if (index === 2) return acc + " C 290 600, 550 720, 750 720";
                    if (index === 3) return acc + " C 950 720, 500 800, 290 850";
                    return acc;
                  }, "");
                  return (
                    <m.path
                      d={pathD}
                      stroke="currentColor"
                      className="text-primary/40"
                      strokeWidth="2"
                      strokeDasharray="6 8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, ease: "easeInOut" }}
                    />
                  );
                })()}
              </svg>
            )}

            {data.map((step, index) => {
              const position = positions[index % positions.length];
              return (
                <Card
                  key={step.title}
                  number={String(index + 1).padStart(2, "0")}
                  title={step.title}
                  description={step.description}
                  colorTheme={step.colorTheme}
                  colors={step.colors}
                  className={position.className}
                  rotate={position.rotate}
                />
              );
            })}
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
