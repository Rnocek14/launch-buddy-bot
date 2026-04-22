import { Search, Radar, Bell, Wrench, ArrowRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Scan your baseline",
    description: "Enter your email. In under 60 seconds, we map your starting exposure across breaches, data brokers, and forgotten accounts.",
    color: "from-primary to-primary/70",
  },
  {
    number: 2,
    icon: Radar,
    title: "We watch for changes",
    description: "Every month, we re-check the same sources. New breach? Broker re-lists you? A forgotten account resurfaces? We catch it.",
    color: "from-accent to-accent/70",
  },
  {
    number: 3,
    icon: Bell,
    title: "Get alerted instantly",
    description: "The moment your exposure shifts, you get an email with exactly what changed and what to do next — no scrolling, no guessing.",
    color: "from-primary to-primary/70",
  },
  {
    number: 4,
    icon: Wrench,
    title: "Fix issues before they spread",
    description: "One-click deletion requests with legal templates. Track responses. Watch your exposure score drop month over month.",
    color: "from-accent to-accent/70",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-background">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Privacy isn't a one-time fix. It's a habit. Here's the loop that keeps you protected.
          </p>
        </div>

        {/* Desktop View - Horizontal Flow */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
            
            <div className="grid grid-cols-4 gap-8 relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <Card className="relative border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2">
                      <CardContent className="p-8">
                        {/* Step Number Badge */}
                        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg animate-pulse`}>
                          {step.number}
                        </div>

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 mx-auto mt-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold mb-3 text-center">{step.title}</h3>
                        <p className="text-muted-foreground text-sm text-center leading-relaxed">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Arrow Connector */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-24 -right-4 transform translate-x-1/2 z-10 animate-pulse">
                        <ArrowRight className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View - Vertical Flow */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Step Number Badge */}
                      <div className={`shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {step.number}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vertical Connector */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent opacity-30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: "800ms" }}>
          <p className="text-lg text-muted-foreground mb-6">
            Start your baseline scan in under 60 seconds.
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8 py-4 text-lg">
              Start Monitoring
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
