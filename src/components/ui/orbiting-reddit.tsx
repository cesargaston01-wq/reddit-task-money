const taskredditLogoAsset = { url: "/taskreddit-logo.png" };

const orbits = [
  {
    size: "h-[280px] w-[280px] md:h-[420px] md:w-[420px]",
    duration: 18,
    angles: [-60, 0, 60],
    icon: "h-7 w-7 md:h-9 md:w-9",
  },
  {
    size: "h-[380px] w-[380px] md:h-[560px] md:w-[560px]",
    duration: 24,
    angles: [0, -90],
    icon: "h-6 w-6 md:h-8 md:w-8",
  },
  {
    size: "h-[480px] w-[480px] md:h-[700px] md:w-[700px]",
    duration: 30,
    angles: [-60, 0, 60],
    icon: "h-5 w-5 md:h-7 md:w-7",
  },
];

export default function OrbitingReddit({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none ${className}`}
    >
      <style>{`
        @keyframes kw-orbit-cw {
          from { transform: rotate(var(--start-angle)); }
          to   { transform: rotate(calc(var(--start-angle) + 360deg)); }
        }
        @keyframes kw-orbit-ccw {
          from { transform: rotate(var(--start-angle)); }
          to   { transform: rotate(calc(var(--start-angle) - 360deg)); }
        }
        @keyframes kw-counter-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes kw-counter-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {orbits.map((orbit, index) => {
        const isCW = index % 2 === 0;
        const all = [...orbit.angles, ...orbit.angles.map((a) => a + 180)];
        return (
          <div
            key={index}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/50 ${orbit.size}`}
          >
            {all.map((angle, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={
                  {
                    "--start-angle": `${angle}deg`,
                    animation: `${isCW ? "kw-orbit-cw" : "kw-orbit-ccw"} ${orbit.duration}s linear infinite`,
                  } as React.CSSProperties
                }
              >
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <div
                    className="flex items-center justify-center rounded-full border border-border/60 bg-surface/80 p-1.5 shadow-lg backdrop-blur"
                    style={{
                      animation: `${isCW ? "kw-counter-cw" : "kw-counter-ccw"} ${orbit.duration}s linear infinite`,
                    }}
                  >
                    <img
                      src={taskredditLogoAsset.url}
                      alt=""
                      className={`${orbit.icon} opacity-90`}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
