import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ParentScanBand } from "@/components/ParentScanBand";
import { SocialProofBar } from "@/components/SocialProofBar";
import { WhatsExposedSection } from "@/components/WhatsExposedSection";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturesWithTestimonials } from "@/components/FeaturesWithTestimonials";
import { Pricing } from "@/components/Pricing";
import { TrustBar } from "@/components/TrustBar";
import { SecurityCompliance } from "@/components/SecurityCompliance";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { BROKER_COUNT_LABEL, GUIDED_OPTOUT_BROKER_COUNT } from "@/config/brokers";
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
    title: "Footprint Finder — Monitor Your Digital Exposure",
    description:
      "Find the accounts, breaches and data-broker listings tied to your email, then clear them with one-click guided opt-outs. Free scan, no credit card.",
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
            // Schema answers are indexed and quoted verbatim, so they have to be
            // literally true: we find listings and hand over a guided opt-out —
            // we do not submit removals to brokers on the user's behalf.
            text: `Footprint Finder is a digital privacy service that scans your Gmail or Outlook inbox to discover every account tied to your email and checks those addresses against known data breaches. On the Complete plan it also searches ${BROKER_COUNT_LABEL} people-search sites for listings of you and gives you a one-click guided opt-out for each one it finds, backed by a removal page with a direct opt-out link for each of the ${GUIDED_OPTOUT_BROKER_COUNT} brokers it tracks. It emails you a monthly privacy report and alerts you when new exposures appear.`,
          },
        },
        {
          "@type": "Question",
          name: "How much does Footprint Finder cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Footprint Finder offers a free scan with no credit card required. Pro is $79/year and adds unlimited deletion requests, deep inbox scanning and monthly rescans. Complete is $129/year and adds data-broker scanning across ${BROKER_COUNT_LABEL} people-search sites with one-click guided opt-outs. A Family plan covering up to 5 people is $179/year.`,
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
      <SecurityCompliance />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
