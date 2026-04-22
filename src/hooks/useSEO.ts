import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

/**
 * Lightweight SEO hook — sets <title>, meta description, canonical,
 * Open Graph tags, and optional JSON-LD without adding a dependency.
 */
export function useSEO({ title, description, canonical, ogImage, jsonLd }: SEOProps) {
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
    setMeta('meta[property="og:type"]', "property", "og:type", "article");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    if (canonical) {
      setMeta('link[rel="canonical"]', "rel", "canonical", canonical);
    }
    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    }

    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.type = "application/ld+json";
      jsonLdScript.text = JSON.stringify(jsonLd);
      jsonLdScript.dataset.dynamicSeo = "1";
      document.head.appendChild(jsonLdScript);
    }

    return () => {
      document.title = previousTitle;
      jsonLdScript?.remove();
    };
  }, [title, description, canonical, ogImage, JSON.stringify(jsonLd)]);
}
