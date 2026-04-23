import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ParentScanBand } from "@/components/ParentScanBand";
import { SocialProofBar } from "@/components/SocialProofBar";
import { WhatsExposedSection } from "@/components/WhatsExposedSection";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturesWithTestimonials } from "@/components/FeaturesWithTestimonials";
import { Pricing } from "@/components/Pricing";
import { TrustBar } from "@/components/TrustBar";
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
    title: "Footprint Finder — Continuously Monitor Your Digital Exposure",
    description:
      "Scan your inbox, find every account, breach, and broker listing tied to your email. Monthly rescans + real-time alerts. Free scan, no credit card.",
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
            text: "Footprint Finder is a digital privacy service that scans your Gmail or Outlook inbox to discover every account tied to your email, checks for data breaches, and removes you from 45+ data broker sites. It runs monthly rescans and alerts you when new exposures appear.",
          },
        },
        {
          "@type": "Question",
          name: "How much does Footprint Finder cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Footprint Finder offers a free scan with no credit card required. Paid plans start at $79/year for full broker removal, monthly rescans, and breach monitoring.",
          },
        },
        {
          "@type": "Question",
          name: "Is Footprint Finder safe to use with my email?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Footprint Finder uses read-only OAuth access to your inbox, only scans email metadata (sender names and subject lines), never reads message bodies, and never stores or shares your email content.",
          },
        },
      ],
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ParentScanBand />
      <SocialProofBar />
      <WhatsExposedSection />
      <HowItWorks />
      <FeaturesWithTestimonials />
      <Pricing />
      <TrustBar />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
