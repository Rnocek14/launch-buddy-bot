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
  // 8 segments around the ring
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
        Footprint — proper anatomical silhouette.
        Sole is an asymmetric teardrop: wider at the ball (top), narrower at the heel (bottom).
        Designed at viewBox 100x100, foot occupies roughly y=22 (toes) to y=78 (heel base).
      */}
      <g fill={footColor} fillRule="evenodd">
        {/* Ball + arch + heel as one continuous shape (right-foot orientation, big toe on left) */}
        <path d="
          M 50 36
          C 58.5 36, 64 41, 64 49
          C 64 53.5, 62.5 57, 60 60
          C 57 64, 56 67, 56 70.5
          C 56 75, 53 78, 50 78
          C 47 78, 44 75, 44 70.5
          C 44 67, 43 64, 40 60
          C 37.5 57, 36 53.5, 36 49
          C 36 41, 41.5 36, 50 36
          Z
        " />
        {/* Big toe — leftmost & largest, slightly higher */}
        <ellipse cx="41.5" cy="27" rx="3.6" ry="4.6" transform="rotate(-8 41.5 27)" />
        {/* Toe 2 */}
        <ellipse cx="47" cy="24" rx="2.9" ry="3.7" />
        {/* Toe 3 */}
        <ellipse cx="52.5" cy="24" rx="2.6" ry="3.3" />
        {/* Toe 4 */}
        <ellipse cx="57" cy="25.5" rx="2.3" ry="2.9" />
        {/* Pinky toe — smallest, lowest */}
        <ellipse cx="60.5" cy="28" rx="2" ry="2.5" />
      </g>
    </svg>
  );
};
