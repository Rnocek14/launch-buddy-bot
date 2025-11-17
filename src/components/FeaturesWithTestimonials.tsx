import { Mail, Search, Send, Trash2, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Quote } from "lucide-react";

const featuresWithTestimonials = [
  {
    feature: {
      icon: Mail,
      title: "Automated Email Scanning",
      description: "Connect your Gmail or Outlook account and let our AI scan your inbox to automatically discover services and platforms you've signed up for.",
      highlights: ["OAuth 2.0 secure connection", "Never stores email content", "Instant results"],
      gradient: "from-primary/20 to-accent/20",
    },
    testimonial: {
      name: "Sarah Chen",
      role: "Privacy Advocate",
      initials: "SC",
      quote: "I was shocked to discover 247 services had my data. The automated scanning found accounts I forgot existed years ago.",
      stats: { services: 247, timespan: "8 years", deletions: 189 },
      avatarColor: "from-primary to-accent",
    },
  },
  {
    feature: {
      icon: Search,
      title: "Privacy Contact Discovery",
      description: "Automatically find privacy contacts, GDPR emails, and deletion request forms for each service you've used.",
      highlights: ["AI-powered search", "200+ services supported", "Constantly updated"],
      gradient: "from-accent/20 to-primary/20",
    },
    testimonial: {
      name: "Marcus Rodriguez",
      role: "Software Engineer",
      initials: "MR",
      quote: "As someone who values privacy, this tool is incredible. The AI-powered discovery found contacts I didn't even know existed. Saved me weeks of manual work.",
      stats: { services: 156, timespan: "5 years", deletions: 143 },
      avatarColor: "from-accent to-primary",
    },
  },
  {
    feature: {
      icon: Send,
      title: "Deletion Request Tracking",
      description: "Send deletion requests with pre-filled templates and track their status in one unified dashboard.",
      highlights: ["GDPR/CCPA compliant", "One-click sending", "Status monitoring"],
      gradient: "from-primary/20 to-accent/20",
    },
    testimonial: {
      name: "Emily Thompson",
      role: "Digital Minimalist",
      initials: "ET",
      quote: "Finally, a privacy tool that actually works! The GDPR templates are professional, and tracking deletion requests in one place is a game-changer.",
      stats: { services: 312, timespan: "12 years", deletions: 267 },
      avatarColor: "from-primary/80 to-accent/80",
    },
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

        <div className="space-y-24">
          {featuresWithTestimonials.map((item, index) => {
            const FeatureIcon = item.feature.icon;
            const isReversed = index % 2 === 1;

            return (
              <div
                key={index}
                className={`grid lg:grid-cols-2 gap-8 items-center ${
                  isReversed ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Feature Card */}
                <Card
                  className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${item.feature.gradient} backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover-scale animate-fade-in ${
                    isReversed ? "lg:col-start-2" : ""
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <FeatureIcon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{item.feature.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {item.feature.description}
                    </p>
                    <ul className="space-y-2">
                      {item.feature.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Testimonial Card */}
                <Card
                  className={`border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in ${
                    isReversed ? "lg:col-start-1 lg:row-start-1" : ""
                  }`}
                  style={{ animationDelay: `${index * 150 + 75}ms` }}
                >
                  <CardContent className="p-8">
                    <Quote className="w-8 h-8 text-primary/20 mb-4" />
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">
                      "{item.testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback
                          className={`bg-gradient-to-br ${item.testimonial.avatarColor} text-white font-semibold`}
                        >
                          {item.testimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{item.testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{item.testimonial.role}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/50">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Trash2 className="w-4 h-4 text-accent" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {item.testimonial.stats.services}
                        </p>
                        <p className="text-xs text-muted-foreground">Found</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="w-4 h-4 text-accent" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {item.testimonial.stats.timespan}
                        </p>
                        <p className="text-xs text-muted-foreground">Data</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Shield className="w-4 h-4 text-accent" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {item.testimonial.stats.deletions}
                        </p>
                        <p className="text-xs text-muted-foreground">Deleted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Aggregate Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24">
          {[
            { value: "12,847", label: "Services Discovered" },
            { value: "8,423", label: "Deletion Requests Sent" },
            { value: "2.1M", label: "Emails Scanned" },
            { value: "98%", label: "User Satisfaction" },
          ].map((stat, index) => (
            <Card
              key={index}
              className="text-center p-6 border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
