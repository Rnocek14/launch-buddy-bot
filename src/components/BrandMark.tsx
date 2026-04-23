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
  const cx = 50;
  const cy = 50;
  const r = 40;
  // 8 segments, ~32deg each with ~13deg gap
  const circumference = 2 * Math.PI * r;
  const segLen = (circumference * 32) / 360;
  const gapLen = (circumference * 13) / 360;
  const dashArray = `${segLen} ${gapLen}`;

  // Dot at ~30deg below horizontal on right side
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

      {/* Footprint — bold, instantly recognizable */}
      <g fill={footColor}>
        {/* Sole: rounded teardrop, wider at heel */}
        <path d="
          M 50 38
          C 58 38, 63 45, 63 53
          C 63 61, 58 67, 50 67
          C 42 67, 37 61, 37 53
          C 37 45, 42 38, 50 38
          Z
        " />
        {/* Big toe */}
        <ellipse cx="55" cy="31" rx="3.8" ry="4.6" />
        {/* Toe 2 */}
        <ellipse cx="49" cy="28" rx="3" ry="3.6" />
        {/* Toe 3 */}
        <ellipse cx="44" cy="28.5" rx="2.6" ry="3.2" />
        {/* Toe 4 */}
        <ellipse cx="39.5" cy="30.5" rx="2.3" ry="2.8" />
        {/* Pinky toe */}
        <ellipse cx="36" cy="33.5" rx="2" ry="2.4" />
      </g>
    </svg>
  );
};
