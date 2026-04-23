import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** Color of the footprint silhouette. Defaults to currentColor so it adapts to light/dark surfaces. */
  footColor?: string;
  /** Color of the dashed scan ring + accent dot. Defaults to brand orange. */
  ringColor?: string;
  title?: string;
}

/**
 * Footprint Finder brand mark.
 * Dashed orange scan ring + footprint silhouette + accent dot (lower-right).
 * Transparent background, scales to any size, inherits foot color from text.
 */
export const BrandMark = ({
  className,
  footColor = "currentColor",
  ringColor = "hsl(var(--accent))",
  title = "Footprint Finder",
}: BrandMarkProps) => {
  // 12-dash ring — gap of ~6deg between dashes
  const dashes = Array.from({ length: 12 }, (_, i) => i * 30);
  const cx = 50;
  const cy = 50;
  const r = 42;
  // arc length per 30deg segment, with ~6deg gap inside
  const segLen = (24 / 360) * 2 * Math.PI * r;
  const gapLen = (6 / 360) * 2 * Math.PI * r;
  const dashArray = `${segLen} ${gapLen}`;

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
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        // rotate so a gap sits at top-center (cleaner balance)
        transform={`rotate(-12 ${cx} ${cy})`}
      />

      {/* Accent dot at ~lower-right of ring (~45deg below horizontal) */}
      <circle
        cx={cx + r * Math.cos((Math.PI / 180) * 35)}
        cy={cy + r * Math.sin((Math.PI / 180) * 35)}
        r="4.5"
        fill={ringColor}
      />

      {/* Footprint silhouette — heel + ball + 5 toes */}
      <g fill={footColor}>
        {/* Sole (heel + ball as one organic shape) */}
        <path d="M50 38
                 C 56 38, 62 44, 62 53
                 C 62 60, 58 65, 54 68
                 C 51 70, 49 71, 47 71
                 C 43 71, 39 68, 38 63
                 C 37 58, 38 52, 41 47
                 C 44 42, 47 38, 50 38 Z" />
        {/* Big toe */}
        <ellipse cx="56" cy="33.5" rx="3.4" ry="4.2" />
        {/* Toe 2 */}
        <ellipse cx="51.5" cy="30.5" rx="2.6" ry="3.4" />
        {/* Toe 3 */}
        <ellipse cx="46.5" cy="29.5" rx="2.3" ry="3" />
        {/* Toe 4 */}
        <ellipse cx="42" cy="30.5" rx="2" ry="2.6" />
        {/* Pinky toe */}
        <ellipse cx="38" cy="33" rx="1.8" ry="2.3" />
      </g>
    </svg>
  );
};
