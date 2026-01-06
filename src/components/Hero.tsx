import { Shield, Zap, Target, Sparkles } from "lucide-react";
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span className="text-sm font-medium text-emerald-700">Plans from $79/year • Complete protection at $129/year</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Find Your Digital Footprint,
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Take Control Back
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          AI-powered inbox scan finds hidden accounts. Guided deletion tools + monthly rescans keep you protected. Start free, upgrade for unlimited from <span className="text-primary font-semibold">$6.58/month</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
          <Link to="/free-scan">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-lg px-8 py-6">
              <Shield className="w-5 h-5" />
              Free Exposure Check
            </Button>
          </Link>
          <Link to="/demo">
            <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
              <Zap className="w-5 h-5" />
              Try Live Demo
            </Button>
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Sign up for full scan →
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link to="/enterprise" className="text-sm text-muted-foreground hover:text-primary">
            Enterprise solutions →
          </Link>
        </div>

        {/* Social Proof */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">Email + Data Brokers</span> — the only tool that scans both
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">169+ Services</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">20 Data Brokers</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">GDPR & CCPA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
