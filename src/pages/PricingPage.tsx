import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Pricing } from "@/components/Pricing";
import { useSEO } from "@/hooks/useSEO";

export default function PricingPage() {
  useSEO({
    title: "Pricing — Footprint Finder Privacy Monitoring Plans",
    description: "Simple privacy monitoring plans. Free scan, Pro at $79/yr, Complete at $129/yr. Monthly rescans, breach alerts, and guided cleanup included.",
    canonical: "https://footprintfinder.co/pricing",
    ogType: "website",
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
