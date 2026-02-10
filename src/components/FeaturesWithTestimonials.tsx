import { Mail, Search, Send, ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const features = [
  {
    icon: Mail,
    title: "Automated Email Scanning",
    description: "Connect your Gmail or Outlook account and we'll scan your inbox to automatically discover services and platforms you've signed up for.",
    highlights: ["Secure sign-in via Google", "Never stores email content", "Instant results"],
    gradient: "from-primary/20 to-accent/20",
  },
  {
    icon: Search,
    title: "Privacy Contact Discovery",
    description: "Automatically find privacy contacts, deletion email addresses, and request forms for each service you've used.",
    highlights: ["Smart search", "Growing database", "Constantly updated"],
    gradient: "from-accent/20 to-primary/20",
  },
  {
    icon: Send,
    title: "Deletion Request Tracking",
    description: "Send deletion requests with pre-filled templates and track their status in one unified dashboard.",
    highlights: ["Legally compliant", "One-click sending", "Status monitoring"],
    gradient: "from-primary/20 to-accent/20",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Save Hours of Work",
    description: "Manual privacy cleanup takes 40+ hours. Our automation does it in minutes.",
  },
  {
    icon: Shield,
    title: "Reduce Data Exposure",
    description: "The average person has 100+ forgotten accounts. Cleaning them up means fewer places your data can be misused.",
  },
  {
    icon: CheckCircle2,
    title: "Stay Protected",
    description: "Monthly rescans catch new signups and ensure deleted accounts stay gone.",
  },
];

export const FeaturesWithTestimonials = () => {
  return (
    <section id="features" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Reclaim Privacy</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful automation that makes digital cleanup simple, secure, and actually doable.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <Card
                key={index}
                className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${feature.gradient} backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FeatureIcon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why It Matters Section */}
        <div className="bg-card/50 backdrop-blur rounded-2xl border border-border/50 p-8 md:p-12 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Why This Matters</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Forgotten accounts keep your personal data scattered across the internet.
              Cleaning up means fewer places where your information is exposed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const BenefitIcon = benefit.icon;
              return (
                <div
                  key={index}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BenefitIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Start Your Free Scan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free tier includes 3 deletions/month
          </p>
        </div>
      </div>
    </section>
  );
};
