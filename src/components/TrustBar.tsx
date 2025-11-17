import { Shield, Lock, FileCheck, Server } from "lucide-react";
import { Badge } from "./ui/badge";

const badges = [
  {
    icon: Shield,
    title: "GDPR",
    subtitle: "Compliant",
    color: "from-primary to-primary/70",
  },
  {
    icon: FileCheck,
    title: "SOC 2",
    subtitle: "Type II",
    color: "from-accent to-accent/70",
  },
  {
    icon: Lock,
    title: "AES-256",
    subtitle: "Encryption",
    color: "from-primary to-primary/70",
  },
  {
    icon: Server,
    title: "Open",
    subtitle: "Source",
    color: "from-accent to-accent/70",
  },
];

export const TrustBar = () => {
  return (
    <section className="py-16 px-4 bg-secondary/20 border-y border-border/50">
      <div className="container max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground mb-1">Trusted by thousands</p>
            <h3 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Enterprise-Grade
              </span>{" "}
              Security
            </h3>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {badges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-primary/50 transition-all duration-300 hover-scale animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-tight">{badge.title}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{badge.subtitle}</p>
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
