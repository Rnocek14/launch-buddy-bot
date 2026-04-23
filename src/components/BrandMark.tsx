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
 * Dashed orange scan ring + bold filled footprint + accent dot.
 *
 * Foot is a single chunky silhouette in the style of a baby footprint stamp:
 * one large rounded sole on the bottom, big toe up-and-slightly-left, four
 * smaller toes arcing down to the right. Designed to remain recognizable at 24px.
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
        Footprint — single bold "baby footprint stamp" style.
        Right foot, slightly tilted. Big toe top-left, four smaller toes arcing right.
        Heel is the wider rounded shape at the bottom.
        viewBox 100x100 — foot lives in approx x=30..70, y=24..78.
      */}
      <g fill={footColor}>
        {/* Sole — heel (bottom oval) + ball (mid) merged into one chunky shape, tilted ~10deg right */}
        <path d="
          M 47 78
          C 39 78, 34 73, 34 65
          C 34 59, 36 54, 39 49
          C 41 46, 43 43, 44 40
          C 45 37, 47 35, 50 35
          C 54 35, 57 38, 58 42
          C 59 47, 60 52, 61 57
          C 62 64, 60 72, 56 76
          C 53 78, 50 78, 47 78
          Z
        " />
        {/* Big toe — top left, large, oval tilted */}
        <ellipse cx="42" cy="29" rx="4" ry="5" transform="rotate(-15 42 29)" />
        {/* Toe 2 */}
        <ellipse cx="50" cy="25.5" rx="2.8" ry="3.6" transform="rotate(-8 50 25.5)" />
        {/* Toe 3 */}
        <ellipse cx="56" cy="25.5" rx="2.5" ry="3.2" />
        {/* Toe 4 */}
        <ellipse cx="61" cy="27.5" rx="2.2" ry="2.8" transform="rotate(8 61 27.5)" />
        {/* Pinky toe — smallest, lowest right */}
        <ellipse cx="65" cy="31" rx="1.9" ry="2.4" transform="rotate(15 65 31)" />
      </g>
    </svg>
  );
};
