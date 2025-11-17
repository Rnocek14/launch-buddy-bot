import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Full scan of 1 email account",
      "See all discovered services",
      "Complete privacy contact details",
      "Risk score & analytics",
      "3 free deletion requests/month",
      "Shareable privacy report",
    ],
    cta: "Get Started Free",
    ctaLink: "/auth",
    popular: false,
    available: true,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Unlimited deletions + deep discovery that finds 2-3× more",
    features: [
      "Everything in Free, plus:",
      "Unlimited deletion requests",
      "Deep AI Scan (finds 2-3× more accounts)",
      "Multi-email scanning (up to 3 addresses)",
      "Complete inbox history analysis",
      "Priority deletion processing",
      "Monthly automatic rescans",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    ctaLink: "/subscribe?plan=monthly",
    popular: true,
    available: true,
    annualPrice: "$99/year",
    annualSavings: "Save $20",
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="container max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your privacy needs. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${
                plan.popular 
                  ? "border-primary shadow-lg shadow-primary/10 scale-105" 
                  : "border-border/50"
              } ${!plan.available ? "opacity-75" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent">
                  Best Value
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                  {plan.annualPrice && (
                    <div className="text-sm text-muted-foreground mt-1">
                      or {plan.annualPrice} • {plan.annualSavings}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Link to={plan.ctaLink || "/auth"} className="w-full">
                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? "bg-primary hover:bg-primary/90" 
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-12">
          🎉 Free during beta! Start scanning your digital footprint today.
        </p>
      </div>
    </section>
  );
};
