import { Shield, Lock, FileCheck, Eye, Key, CheckCircle2, Server, AlertCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

const certifications = [
  {
    icon: Shield,
    title: "GDPR Compliant",
    badge: "EU Certified",
    description: "Fully compliant with European data protection regulations. Your right to be forgotten is our core mission.",
    color: "from-primary to-primary/70",
  },
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    badge: "Audited",
    description: "Independently audited security controls ensuring your data is handled with the highest standards.",
    color: "from-accent to-accent/70",
  },
  {
    icon: Lock,
    title: "AES-256 Encryption",
    badge: "Military Grade",
    description: "All data encrypted at rest and in transit using industry-leading AES-256 encryption standards.",
    color: "from-primary to-primary/70",
  },
  {
    icon: Server,
    title: "ISO 27001",
    badge: "Certified",
    description: "Information security management system certified to international standards.",
    color: "from-accent to-accent/70",
  },
];

const commitments = [
  {
    icon: Eye,
    title: "Zero Data Retention",
    description: "We never store your email content. Only service names are saved to help track your cleanup progress.",
  },
  {
    icon: Key,
    title: "OAuth 2.0 Security",
    description: "Secure authentication without ever accessing your password. Revoke access anytime from your email provider.",
  },
  {
    icon: CheckCircle2,
    title: "Open Source",
    description: "Our code is publicly auditable. Verify our security practices and privacy commitments yourself.",
  },
  {
    icon: AlertCircle,
    title: "Regular Audits",
    description: "Quarterly security audits and penetration testing to identify and fix vulnerabilities proactively.",
  },
];

export const SecurityCompliance = () => {
  return (
    <section id="security" className="py-24 px-4 bg-background">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Enterprise-Grade Security</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your Privacy is{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Priority
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bank-level security and compliance standards to protect your most sensitive data
          </p>
        </div>

        {/* Certifications Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {certifications.map((cert, index) => {
            const Icon = cert.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  {/* Badge */}
                  <Badge className={`absolute top-4 right-4 bg-gradient-to-r ${cert.color} text-white border-0`}>
                    {cert.badge}
                  </Badge>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${cert.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cert.description}
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
            <h3 className="text-2xl font-bold mb-3">Trusted by Privacy-Conscious Users Worldwide</h3>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
              We take security seriously because we know how important your privacy is. Every line of code is written with your data protection in mind. Our infrastructure is designed to minimize data collection while maximizing your control.
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
