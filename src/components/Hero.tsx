import { Shield, Rocket } from "lucide-react";
import { WaitlistForm } from "./WaitlistForm";
import { LiveCounter } from "./LiveCounter";
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

        <WaitlistForm />

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link to="/dashboard">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
              <Shield className="w-4 h-4" />
              Try Scanner Now
            </Button>
          </Link>
          <Link to="/alpha">
            <Button variant="outline" size="lg" className="gap-2">
              <Rocket className="w-4 h-4" />
              Apply for Alpha Access
            </Button>
          </Link>
        </div>

        <LiveCounter />
      </div>
    </section>
  );
};
