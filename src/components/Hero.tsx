import { Shield, Zap, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background opacity-50" />
      
      {/* Animated circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 max-w-5xl text-center">
        {/* Icon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Privacy-First Digital Cleanup</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Find Your Digital Footprint,
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Take Control Back
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Discover where your data lives across the internet. Get guided deletion tools and track your cleanup progress—all in one privacy-focused dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/auth">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-lg px-8 py-6">
              <Shield className="w-5 h-5" />
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary/5 border border-primary/10">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">
              <span className="text-primary font-bold">12,000+</span> users have cleaned up their digital footprint
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Fully Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Instant Scan</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">GDPR Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
