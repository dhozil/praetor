import { useEffect, useState } from "react";

/**
 * Roman ceremonial candle. The flame flickers continuously.
 * When `active` is true, the candle "burns down": wax level drops from 100 → 0
 * over `durationMs`, signalling that a process is underway.
 */
export function RomanCandle({
  active = false,
  durationMs = 4000,
  label = "Deliberating…",
  size = "md",
}: {
  active?: boolean;
  durationMs?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [progress, setProgress] = useState(0); // 0..1 burn amount

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationMs]);

  const dims = {
    sm: { w: 60, h: 160 },
    md: { w: 84, h: 220 },
    lg: { w: 110, h: 300 },
  }[size];

  // wax shrinks from full to 20% of body
  const waxHeight = 1 - progress * 0.8;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 100 260"
        width={dims.w}
        height={dims.h}
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wax" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.96 0.01 90)" />
            <stop offset="50%" stopColor="oklch(0.88 0.03 85)" />
            <stop offset="100%" stopColor="oklch(0.7 0.05 75)" />
          </linearGradient>
          <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.98 0.02 90)" />
            <stop offset="55%" stopColor="oklch(0.88 0.18 78)" />
            <stop offset="100%" stopColor="oklch(0.7 0.22 45)" />
          </linearGradient>
          <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.14 82)" />
            <stop offset="100%" stopColor="oklch(0.55 0.12 70)" />
          </linearGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.9 0.18 82 / 0.9)" />
            <stop offset="70%" stopColor="oklch(0.82 0.15 82 / 0.15)" />
            <stop offset="100%" stopColor="oklch(0.82 0.15 82 / 0)" />
          </radialGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* ornate gold base */}
        <g transform="translate(0,220)">
          <rect x="20" y="20" width="60" height="10" rx="2" fill="url(#base)" />
          <rect x="14" y="26" width="72" height="6" rx="2" fill="url(#base)" />
          <ellipse cx="50" cy="20" rx="30" ry="6" fill="url(#base)" />
        </g>

        {/* candle body — height driven by wax */}
        <g transform="translate(30, 60)">
          {/* full body outline (dark) */}
          <rect
            x="0"
            y="0"
            width="40"
            height="160"
            rx="6"
            fill="oklch(0.14 0.005 60)"
            stroke="oklch(0.82 0.15 82 / 0.25)"
          />
          {/* burning wax */}
          <rect
            x="0"
            y={160 * (1 - waxHeight)}
            width="40"
            height={160 * waxHeight}
            rx="6"
            fill="url(#wax)"
            style={{ transition: "y 120ms linear, height 120ms linear" }}
          />
          {/* melted rim highlight */}
          <ellipse
            cx="20"
            cy={160 * (1 - waxHeight)}
            rx="20"
            ry="3"
            fill="oklch(0.95 0.02 85)"
            style={{ transition: "cy 120ms linear" }}
          />
          {/* wax drip */}
          <path
            d={`M 6 ${160 * (1 - waxHeight) + 4} q 2 ${12 + progress * 30} 0 ${20 + progress * 40}`}
            stroke="oklch(0.9 0.02 85)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity={active ? 0.8 : 0}
            style={{ transition: "opacity 300ms" }}
          />
        </g>

        {/* wick + flame at current wax top */}
        <g
          transform={`translate(50, ${60 + 160 * (1 - waxHeight)})`}
          style={{ transition: "transform 120ms linear" }}
        >
          {/* halo */}
          <circle cx="0" cy="-16" r="34" fill="url(#halo)">
            {active && (
              <animate
                attributeName="r"
                values="32;38;32"
                dur="1.6s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          {/* wick */}
          <line x1="0" y1="-2" x2="0" y2="-14" stroke="oklch(0.2 0 0)" strokeWidth="1.4" />
          {/* flame */}
          <g filter="url(#soft)">
            <path
              d="M 0 -34 C 8 -24, 8 -14, 0 -8 C -8 -14, -8 -24, 0 -34 Z"
              fill="url(#flame)"
            >
              <animate
                attributeName="d"
                dur="0.9s"
                repeatCount="indefinite"
                values="
                  M 0 -34 C 8 -24, 8 -14, 0 -8 C -8 -14, -8 -24, 0 -34 Z;
                  M 0 -38 C 9 -26, 7 -14, 0 -8 C -7 -14, -9 -26, 0 -38 Z;
                  M 0 -32 C 7 -22, 9 -14, 0 -8 C -9 -14, -7 -22, 0 -32 Z;
                  M 0 -34 C 8 -24, 8 -14, 0 -8 C -8 -14, -8 -24, 0 -34 Z"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-3;3;-2;3;-3"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </path>
            {/* inner blue core */}
            <path
              d="M 0 -18 C 3 -14, 3 -10, 0 -8 C -3 -10, -3 -14, 0 -18 Z"
              fill="oklch(0.9 0.12 240 / 0.6)"
            />
          </g>
        </g>
      </svg>

      {label && (
        <div className="text-xs uppercase tracking-[0.3em] text-gold-soft">
          {active ? label : "Ready"}
        </div>
      )}
    </div>
  );
}
