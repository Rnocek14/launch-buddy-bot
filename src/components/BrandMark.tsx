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
        {/* Sole: heel (bottom rounded) tapering up to ball of foot, slightly tilted */}
        <path d="
          M 50 36
          C 57 36, 62 42, 62 50
          C 62 58, 58 64, 53 67
          C 50 69, 47 69, 44 67
          C 39 64, 36 58, 37 51
          C 38 44, 43 36, 50 36
          Z
        " />
        {/* Big toe (top, largest) */}
        <ellipse cx="54" cy="30" rx="3.6" ry="4.4" />
        {/* Toe 2 */}
        <ellipse cx="48" cy="27" rx="2.8" ry="3.5" />
        {/* Toe 3 */}
        <ellipse cx="43" cy="27.5" rx="2.5" ry="3.1" />
        {/* Toe 4 */}
        <ellipse cx="38.5" cy="29.5" rx="2.2" ry="2.7" />
        {/* Pinky toe */}
        <ellipse cx="35" cy="32.5" rx="1.9" ry="2.3" />
      </g>
    </svg>
  );
};
