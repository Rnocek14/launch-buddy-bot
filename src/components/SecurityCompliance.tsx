import { Shield, Lock, FileCheck, Eye, EyeOff, Key, CheckCircle2, Server } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

// NOTE: Every claim below is verifiable in the codebase. We deliberately do NOT
// assert certifications we don't hold (SOC 2 Type II audit of this app, ISO 27001,
// scheduled third-party pen-tests, "open source"). Add those back only when they
// are real — a false compliance badge is false advertising and toxic for a
// privacy brand.
const guarantees = [
  {
    icon: Lock,
    title: "AES-256 Encryption",
    badge: "At rest & in transit",
    description: "Your OAuth tokens and data are encrypted at rest with AES-256 and protected in transit with TLS.",
    color: "from-primary to-primary/70",
  },
  {
    icon: Eye,
    title: "Read-Only Metadata",
    badge: "Metadata only",
    description: "We request read-only access to email metadata (sender, subject, date). We never read, store, or index the content of your emails.",
    color: "from-accent to-accent/70",
  },
  {
    icon: Server,
    title: "SOC 2 Infrastructure",
    badge: "Supabase",
    description: "Runs on Supabase — a SOC 2 Type II–compliant platform — with row-level security isolating every account's data.",
    color: "from-primary to-primary/70",
  },
  {
    icon: FileCheck,
    title: "GDPR & CCPA Aligned",
    badge: "Your right to be forgotten",
    description: "Built around your data rights. Request deletion of your own data at any time — honoring GDPR and CCPA.",
    color: "from-accent to-accent/70",
  },
];

const commitments = [
  {
    icon: EyeOff,
    title: "Zero Content Retention",
    description: "We never store your email content. Only service names are saved, to help track your cleanup progress.",
  },
  {
    icon: Key,
    title: "OAuth 2.0 Security",
    description: "Secure sign-in without ever seeing your password. Revoke our access anytime from your email provider.",
  },
  {
    icon: Shield,
    title: "Row-Level Security",
    description: "Every database table enforces row-level security, so your data is only ever accessible to you.",
  },
  {
    icon: CheckCircle2,
    title: "No Data Selling",
    description: "We never sell, rent, or share your personal data. Our business is removing your data — not trading it.",
  },
];

export const SecurityCompliance = () => {
  return (
    <section id="security" className="py-24 px-4 bg-background">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Security & Privacy by Design</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your Privacy is{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Priority
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Strong encryption, read-only access, and clear commitments to protect your most sensitive data
          </p>
        </div>

        {/* Guarantees Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {guarantees.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  {/* Badge */}
                  <Badge className={`absolute top-4 right-4 bg-gradient-to-r ${item.color} text-white border-0`}>
                    {item.badge}
                  </Badge>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Privacy Commitments */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
            Our Privacy Commitments
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {commitments.map((commitment, index) => {
              const Icon = commitment.icon;
              return (
                <Card
                  key={index}
                  className="border-border/50 bg-card/50 backdrop-blur hover:border-accent/50 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2">{commitment.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {commitment.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Trust Statement */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur animate-fade-in" style={{ animationDelay: "800ms" }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">Built for Privacy-Conscious Users</h3>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
              We take security seriously because we know how important your privacy is. Our infrastructure is designed to minimize data collection while maximizing your control.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-foreground/80">No Third-Party Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-foreground/80">No Data Selling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-foreground/80">No Hidden Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-foreground/80">100% Transparent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
