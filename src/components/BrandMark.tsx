import { cn } from "@/lib/utils";
import brandMarkLight from "@/assets/brand-mark.png";
import brandMarkDark from "@/assets/brand-mark-dark.png";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * Footprint Finder brand mark — official logo asset.
 * Orange dashed scan ring + accent dot + footprint silhouette.
 * Light mode: black disc with white footprint.
 * Dark mode: same disc tuned for dark backgrounds.
 */
export const BrandMark = ({
  className,
  title = "Footprint Finder",
}: BrandMarkProps) => {
  return (
    <>
      <img
        src={brandMarkLight}
        alt={title}
        className={cn("shrink-0 object-contain block dark:hidden", className)}
        loading="eager"
        decoding="async"
      />
      <img
        src={brandMarkDark}
        alt={title}
        className={cn("shrink-0 object-contain hidden dark:block", className)}
        loading="eager"
        decoding="async"
      />
    </>
  );
};
