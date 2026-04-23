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
 *
 * Hand-crafted SVG: dashed orange scan ring + bold filled footprint + accent dot.
 * The footprint is intentionally chunky and slightly "cute" (baby-footprint stamp
 * style) so it remains recognizable down to ~24px. Foot inherits currentColor.
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

  // 8 dash segments around ring with a noticeable gap on lower-right for the dot
  const circumference = 2 * Math.PI * r;
  const segLen = (circumference * 32) / 360;
  const gapLen = (circumference * 13) / 360;
  const dashArray = `${segLen} ${gapLen}`;

  // Accent dot at ~35° below horizontal on the right
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
        Footprint — chunky baby-stamp style, vertical orientation.
        Big rounded sole bottom + 5 toe pads in an arc on top.
        Sole occupies y=42..76, toes y=22..40. All pads are GENEROUSLY sized
        and slightly overlap the sole so the mark stays legible at small sizes.
      */}
      <g fill={footColor}>
        {/* Sole — single chunky teardrop, wider at top (ball of foot), rounded heel */}
        <path d="
          M 50 42
          C 60 42, 65 48, 65 56
          C 65 64, 62 70, 58 73
          C 55 75, 53 76, 50 76
          C 47 76, 45 75, 42 73
          C 38 70, 35 64, 35 56
          C 35 48, 40 42, 50 42
          Z
        " />
        {/* Toes arranged in an arc above sole, big toe leftmost */}
        {/* Big toe — biggest, most prominent */}
        <ellipse cx="38" cy="34" rx="4.5" ry="5.5" />
        {/* Toe 2 */}
        <ellipse cx="46" cy="29" rx="3.5" ry="4.3" />
        {/* Toe 3 — center top */}
        <ellipse cx="53" cy="28" rx="3.2" ry="4" />
        {/* Toe 4 */}
        <ellipse cx="59.5" cy="30" rx="3" ry="3.7" />
        {/* Pinky toe — smallest */}
        <ellipse cx="64" cy="34" rx="2.6" ry="3.2" />
      </g>
    </svg>
  );
};
