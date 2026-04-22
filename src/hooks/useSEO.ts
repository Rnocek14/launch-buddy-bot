import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  /** Single JSON-LD object or an array of objects (e.g., HowTo + FAQPage). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Optional override for og:type (defaults to "article"). */
  ogType?: string;
  /** noindex if you want to keep a page out of search results. */
  noindex?: boolean;
}

/**
 * Lightweight SEO hook — sets <title>, meta description, canonical,
 * Open Graph tags, optional JSON-LD, and robots directives.
 * Supports multiple JSON-LD blocks per page.
 */
export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  jsonLd,
  ogType = "article",
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const setMeta = (selector: string, attr: string, name: string, content: string) => {
      let tag = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
      if (!tag) {
        if (selector.startsWith("link")) {
          tag = document.createElement("link");
          (tag as HTMLLinkElement).rel = name;
        } else {
          tag = document.createElement("meta");
          (tag as HTMLMetaElement).setAttribute(attr, name);
        }
        document.head.appendChild(tag);
      }
      if (selector.startsWith("link")) {
        (tag as HTMLLinkElement).href = content;
      } else {
        (tag as HTMLMetaElement).content = content;
      }
    };

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", ogType);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex,nofollow" : "index,follow");

    if (canonical) {
      setMeta('link[rel="canonical"]', "rel", "canonical", canonical);
      setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    }
    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    }

    // Remove any previously injected dynamic JSON-LD blocks
    document.head
      .querySelectorAll('script[data-dynamic-seo="1"]')
      .forEach((el) => el.remove());

    const injectedScripts: HTMLScriptElement[] = [];
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const block of blocks) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(block);
        script.dataset.dynamicSeo = "1";
        document.head.appendChild(script);
        injectedScripts.push(script);
      }
    }

    return () => {
      document.title = previousTitle;
      injectedScripts.forEach((s) => s.remove());
    };
  }, [title, description, canonical, ogImage, ogType, noindex, JSON.stringify(jsonLd)]);
}

