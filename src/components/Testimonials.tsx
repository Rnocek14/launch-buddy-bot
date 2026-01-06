import { Card, CardContent } from "./ui/card";
import { Shield, Zap, Target, Lock, Sparkles, CheckCircle } from "lucide-react";

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Early Access Program</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Privacy-Conscious Users Choose Us
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're a new tool built by privacy advocates, for privacy advocates
          </p>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email + Data Brokers</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Unlike competitors who only handle data brokers, we scan your inbox to find every service that has your data—then help you delete from all of them.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle className="w-4 h-4" />
                <span>Unique in the market</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Half the Price</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                DeleteMe charges $129/year for just data brokers. We include email scanning + data brokers for the same price—or $79/year for email-only.
              </p>
              <div className="flex items-center gap-2 text-sm text-accent">
                <CheckCircle className="w-4 h-4" />
                <span>Best value available</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy-First Design</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Your data never leaves your browser for scanning. We only store encrypted tokens—never your emails. Open audit coming soon.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle className="w-4 h-4" />
                <span>Fully encrypted</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Honest Stats Banner */}
        <div className="grid md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                169+
              </p>
              <p className="text-sm text-muted-foreground">Services Cataloged</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-primary/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
                20
              </p>
              <p className="text-sm text-muted-foreground">Data Brokers Covered</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                GDPR
              </p>
              <p className="text-sm text-muted-foreground">& CCPA Compliant</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-primary/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
                Free
              </p>
              <p className="text-sm text-muted-foreground">Tier Available</p>
            </CardContent>
          </Card>
        </div>

        {/* Early Adopter CTA */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: "600ms" }}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 inline-block">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-lg font-semibold">Early Adopter Benefits</span>
              </div>
              <p className="text-muted-foreground max-w-lg">
                Join our early access program and help shape the future of personal privacy tools. 
                Early adopters get priority support and influence on our roadmap.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
