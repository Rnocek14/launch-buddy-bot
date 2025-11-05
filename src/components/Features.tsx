import { Search, FileText, BarChart3, Shield, Zap, Lock } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const features = [
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Scan your Gmail and browser history to map your digital footprint across hundreds of services.",
  },
  {
    icon: FileText,
    title: "Deletion Toolkit",
    description: "Access service-specific templates and step-by-step guides to request account deletions quickly.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description: "Track your cleanup journey with visual insights showing what's done and what's pending.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Secure server-side scanning with encryption. Your email content is never stored—only service names are saved.",
  },
  {
    icon: Zap,
    title: "Quick Actions",
    description: "One-click access to account deletion pages and GDPR request forms for major platforms.",
  },
  {
    icon: Lock,
    title: "Secure & Open",
    description: "Built with privacy in mind. Open-source and transparent—verify our code yourself.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Reclaim Privacy</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed to make digital cleanup simple, secure, and actually doable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-border/50 bg-card/50 backdrop-blur hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
