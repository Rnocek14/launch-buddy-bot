import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SocialProofBar } from "@/components/SocialProofBar";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturesWithTestimonials } from "@/components/FeaturesWithTestimonials";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useEffect } from "react";

const Index = () => {
  // Handle direct hash navigation (e.g. /#pricing) on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    // Wait for sections to mount
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 250);
    return () => clearTimeout(t);
  }, []);

  useSEO({
    title: "Footprint Finder — Make Sense of Your Online Privacy",
    description:
      "Check known breaches for free. Optionally connect Gmail or Outlook to discover old accounts, review exposure, and manage privacy requests in one place.",
    canonical: "https://footprintfinder.co/",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Footprint Finder?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Footprint Finder offers an email-based breach check. If you choose to connect Gmail or Outlook, its read-only metadata scanner helps identify services that may hold your information. Paid plans add cleanup-request tools and supported people-search checks with guided opt-out instructions.",
          },
        },
        {
          "@type": "Question",
          name: "How much does Footprint Finder cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Footprint Finder offers a free email breach check. Pro is $79/year and adds deletion-request tools, deeper inbox discovery, and monthly rescans. Complete is $129/year and adds supported broker searching and guided opt-out steps. Family pricing is $179/year.",
          },
        },
        {
          "@type": "Question",
          name: "Is Footprint Finder safe to use with my email?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The free breach check does not require inbox access. Optional Gmail or Outlook connection uses OAuth read-only permissions to process email metadata such as senders and subject lines, not message bodies. Review the privacy policy for data handling details.",
          },
        },
      ],
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SocialProofBar />
      <HowItWorks />
      <FeaturesWithTestimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
