import { Shield, Lock, Eye, Database } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "GDPR Ready",
    subtitle: "Templates Included",
    color: "from-primary to-primary/70",
  },
  {
    icon: Lock,
    title: "OAuth 2.0",
    subtitle: "Secure Auth",
    color: "from-accent to-accent/70",
  },
  {
    icon: Eye,
    title: "Read-Only",
    subtitle: "Email Access",
    color: "from-primary to-primary/70",
  },
  {
    icon: Database,
    title: "No Storage",
    subtitle: "Of Email Content",
    color: "from-accent to-accent/70",
  },
];

export const TrustBar = () => {
  return (
    <section className="py-16 px-4 bg-secondary/20 border-y border-border/50">
      <div className="container max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground mb-1">Built for privacy</p>
            <h3 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Security First
              </span>{" "}
              Design
            </h3>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-primary/50 transition-all duration-300 hover-scale animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-tight">{feature.title}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{feature.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
