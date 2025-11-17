import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Quote, Trash2, Clock, Shield } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Privacy Advocate",
    initials: "SC",
    quote: "I was shocked to discover 247 services had my data. Footprint Finder made deletion requests so easy—I cleaned up accounts I forgot existed years ago.",
    stats: {
      services: 247,
      timespan: "8 years",
      deletions: 189,
    },
    avatarColor: "from-primary to-accent",
  },
  {
    name: "Marcus Rodriguez",
    role: "Software Engineer",
    initials: "MR",
    quote: "As someone who values privacy, this tool is incredible. The automated email scanning found services I didn't even remember signing up for. Saved me weeks of manual work.",
    stats: {
      services: 156,
      timespan: "5 years",
      deletions: 143,
    },
    avatarColor: "from-accent to-primary",
  },
  {
    name: "Emily Thompson",
    role: "Digital Minimalist",
    initials: "ET",
    quote: "Finally, a privacy tool that actually works! The GDPR templates are professional, and tracking deletion requests in one place is a game-changer.",
    stats: {
      services: 312,
      timespan: "12 years",
      deletions: 267,
    },
    avatarColor: "from-primary/80 to-accent/80",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real Results from Real Users
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands who have taken back control of their digital privacy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-8">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-primary/20 mb-4" />

                {/* Testimonial Quote */}
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`bg-gradient-to-br ${testimonial.avatarColor} text-white font-semibold`}>
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Trash2 className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{testimonial.stats.services}</p>
                    <p className="text-xs text-muted-foreground">Found</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{testimonial.stats.timespan}</p>
                    <p className="text-xs text-muted-foreground">Data</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Shield className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{testimonial.stats.deletions}</p>
                    <p className="text-xs text-muted-foreground">Deleted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Aggregate Stats Banner */}
        <div className="grid md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                12,847
              </p>
              <p className="text-sm text-muted-foreground">Services Discovered</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-primary/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
                8,923
              </p>
              <p className="text-sm text-muted-foreground">Deletion Requests Sent</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                2.4M
              </p>
              <p className="text-sm text-muted-foreground">Emails Scanned</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-primary/10 backdrop-blur">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
                98%
              </p>
              <p className="text-sm text-muted-foreground">User Satisfaction</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
