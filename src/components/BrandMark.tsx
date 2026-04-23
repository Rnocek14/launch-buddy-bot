import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** Color of the footprint silhouette. Defaults to currentColor. */
  footColor?: string;
  /** Color of the dashed scan ring + accent dot. Defaults to brand orange. */
  ringColor?: string;
  title?: string;
}

/**
 * Footprint Finder brand mark.
 * Dashed orange scan ring + footprint silhouette + accent dot (lower-right).
 *
 * Footprint geometry derived from the Lucide "Footprints" icon (ISC licensed) —
 * proven legible at any size. We use only the front foot, scaled and centered.
 */
export const BrandMark = ({
  className,
  footColor = "currentColor",
  ringColor = "hsl(var(--accent))",
  title = "Footprint Finder",
}: BrandMarkProps) => {
  const cx = 50;
  const cy = 50;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const segLen = (circumference * 32) / 360;
  const gapLen = (circumference * 13) / 360;
  const dashArray = `${segLen} ${gapLen}`;

  const dotAngle = 35;
  const dotX = cx + r * Math.cos((Math.PI / 180) * dotAngle);
  const dotY = cy + r * Math.sin((Math.PI / 180) * dotAngle);

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill="none"
    >
      <title>{title}</title>

      {/* Dashed scan ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={ringColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        transform={`rotate(-16 ${cx} ${cy})`}
      />

      {/* Accent dot */}
      <circle cx={dotX} cy={dotY} r="5" fill={ringColor} />

      {/*
        Footprint — from Lucide "Footprints" icon (ISC licensed).
        Original viewBox 24x24, source paths:
          <path d="M4 16v-2.38c0-.83.43-1.61 1.13-2.05A8.95 8.95 0 0 1 10 10c1.79 0 3.45.5 4.87 1.34a2.43 2.43 0 0 1 1.13 2.05V16"/>
          <path d="M4 22v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>
          <ellipse cx="6" cy="5" rx="2" ry="2.5"/>
          <ellipse cx="10" cy="3" rx="1.5" ry="2"/>
          <ellipse cx="14" cy="3" rx="1.5" ry="2"/>
          <ellipse cx="18" cy="5" rx="2" ry="2.5"/>
          <path d="M20 16v-2.38c0-.83-.43-1.61-1.13-2.05a8.95 8.95 0 0 0-9.74 0..."/>
        We collapse it to a single foot, filled solid, scaled into a 56x56 box centered at (50,50)
        of our 100x100 viewBox: translate(22,22) scale(2.333).
      */}
      <g transform="translate(22 22) scale(2.333)" fill={footColor} stroke={footColor} strokeWidth="0.6" strokeLinejoin="round">
        {/* Sole + ankle as one filled shape */}
        <path d="
          M 4 16
          v -2.38
          c 0 -0.83 0.43 -1.61 1.13 -2.05
          A 8.95 8.95 0 0 1 12 10
          c 2.5 0 4.85 0.5 6.87 1.57
          C 19.57 12.01 20 12.79 20 13.62
          V 16
          a 2 2 0 0 1 -2 2
          H 6
          a 2 2 0 0 1 -2 -2
          Z
        " />
        {/* Toes — 5 round pads above the sole, big toe leftmost */}
        <ellipse cx="6" cy="5" rx="2" ry="2.5" />
        <ellipse cx="10" cy="3" rx="1.6" ry="2.2" />
        <ellipse cx="14" cy="3" rx="1.6" ry="2.2" />
        <ellipse cx="18" cy="5" rx="2" ry="2.5" />
        <ellipse cx="21.5" cy="7.5" rx="1.5" ry="2" />
      </g>
    </svg>
  );
};
