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
  const circumference = 2 * Math.PI * r;
  const segLen = (circumference * 32) / 360;
  const gapLen = (circumference * 13) / 360;
  const dashArray = `${segLen} ${gapLen}`;

  // Accent dot at ~35deg below horizontal on right
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
        Footprint — bold sole with 5 clearly separated toe pads above.
        Designed at viewBox 100x100. Foot occupies y=22 (toe tops) → y=78 (heel base),
        x=33 → x=67. Big toe on the LEFT (right-foot orientation, viewer's perspective).
      */}
      <g fill={footColor}>
        {/* Sole — wider at ball (top), narrower curved heel (bottom) */}
        <path d="
          M 50 38
          C 60 38, 65 44, 65 51
          C 65 56, 63 60, 60 63
          C 57 66, 55 70, 55 73
          C 55 76.5, 52.5 79, 50 79
          C 47.5 79, 45 76.5, 45 73
          C 45 70, 43 66, 40 63
          C 37 60, 35 56, 35 51
          C 35 44, 40 38, 50 38
          Z
        " />
        {/* Big toe — leftmost, biggest, slightly higher */}
        <ellipse cx="40" cy="28" rx="4.2" ry="5" />
        {/* Toe 2 */}
        <ellipse cx="47" cy="24.5" rx="3.2" ry="3.8" />
        {/* Toe 3 */}
        <ellipse cx="53" cy="24.5" rx="2.9" ry="3.5" />
        {/* Toe 4 */}
        <ellipse cx="58.5" cy="26" rx="2.5" ry="3" />
        {/* Pinky toe — smallest, lowest */}
        <ellipse cx="63" cy="29" rx="2.2" ry="2.6" />
      </g>
    </svg>
  );
};
