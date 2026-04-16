import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SocialProofBar } from "@/components/SocialProofBar";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturesWithTestimonials } from "@/components/FeaturesWithTestimonials";
import { Pricing } from "@/components/Pricing";
import { TrustBar } from "@/components/TrustBar";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SocialProofBar />
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
