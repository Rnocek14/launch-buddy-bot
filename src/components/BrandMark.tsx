import { cn } from "@/lib/utils";
import brandMarkLight from "@/assets/brand-mark.webp";
import brandMarkDark from "@/assets/brand-mark-dark.webp";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/**
 * Footprint Finder brand mark — official logo asset.
 * Orange dashed scan ring + accent dot + footprint silhouette.
 * Light mode: black disc with white footprint.
 * Dark mode: same disc tuned for dark backgrounds.
 *
 * PERFORMANCE: these were 1024x1024 PNGs at ~1.35 MB each, and because the
 * theme variants are toggled with `hidden`/`dark:block` rather than swapped,
 * browsers downloaded BOTH on every page load — ~2.7 MB to paint a 36 px
 * logo in the navbar. They are now 128 px WebP (~5 KB each), which still
 * covers 3x DPR at the largest size the mark is ever rendered.
 *
 * Keep them small. This component sits in the header and footer of every
 * page, so its weight lands directly on Largest Contentful Paint.
 *
 * width/height are set explicitly so the browser reserves the box before the
 * image arrives; without them the logo contributes layout shift sitewide.
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
        width={128}
        height={128}
        className={cn("shrink-0 object-contain block dark:hidden", className)}
        loading="eager"
        decoding="async"
      />
      <img
        src={brandMarkDark}
        alt={title}
        width={128}
        height={128}
        className={cn("shrink-0 object-contain hidden dark:block", className)}
        loading="eager"
        decoding="async"
      />
    </>
  );
};
