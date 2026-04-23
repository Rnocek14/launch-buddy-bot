import { cn } from "@/lib/utils";
import brandMarkImg from "@/assets/brand-mark.png";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * Footprint Finder brand mark — official logo asset.
 * Orange dashed scan ring + accent dot + bold black footprint.
 */
export const BrandMark = ({
  className,
  title = "Footprint Finder",
}: BrandMarkProps) => {
  return (
    <img
      src={brandMarkImg}
      alt={title}
      className={cn("shrink-0 object-contain", className)}
      loading="eager"
      decoding="async"
    />
  );
};
