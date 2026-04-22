import { Radar, Bell, TrendingDown, Shield, Zap, Lock, CheckCircle, Globe, FileText } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const keyFeatures = [
  {
    icon: Radar,
    title: "Continuous Exposure Monitoring",
    description: "We don't scan once and disappear. Your data leaks evolve — new breaches, new broker listings, new accounts. We re-scan automatically every month.",
    highlights: ["Monthly automated rescans", "Breach + broker + account tracking", "Diff detection across scans"],
    gradient: "from-primary/20 to-accent/20",
  },
  {
    icon: Bell,
    title: "Real-Time Change Alerts",
    description: "When your exposure shifts, you know first. New breach? Broker re-lists you? Risk score jumps? We surface it with the exact action to take.",
    highlights: ["Triggered email alerts", "'New since last scan' tagging", "Prioritized by severity"],
    gradient: "from-accent/20 to-primary/20",
  },
  {
    icon: TrendingDown,
    title: "Guided Cleanup + Score Tracking",
    description: "One-click deletion requests with legal templates. Watch your exposure score drop month over month — proof your privacy is actually improving.",
    highlights: ["GDPR/CCPA compliant requests", "Score history & trendline", "Response tracking"],
    gradient: "from-primary/20 to-accent/20",
  },
];

const additionalFeatures = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "End-to-end encryption with zero-knowledge architecture. Your data stays yours.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Scan thousands of emails in seconds with our optimized processing pipeline.",
  },
  {
    icon: Lock,
    title: "Secure & Open",
    description: "Built with security best practices. Open-source and auditable.",
  },
  {
    icon: CheckCircle,
    title: "Smart Matching",
    description: "Advanced algorithms match email senders to our comprehensive service catalog.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Support for international services with multi-language deletion templates.",
  },
  {
    icon: FileText,
    title: "Custom Templates",
    description: "Legal-approved templates for GDPR, CCPA, and other privacy regulations.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy is
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Maintenance</span>, Not a One-Time Fix
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your data resurfaces constantly. We monitor it, alert you to change, and help you act fast.
          </p>
        </div>

        {/* Key Features - Large Animated Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {keyFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${feature.gradient} backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover-scale animate-fade-in`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                        <span className="text-foreground/80">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Features - Compact Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-border/50 bg-card/50 backdrop-blur hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 animate-fade-in"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
