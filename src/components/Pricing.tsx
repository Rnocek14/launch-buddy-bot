import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Scan up to 50 services",
      "Basic deletion guides",
      "Progress tracking",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious privacy advocates",
    features: [
      "Unlimited service scanning",
      "AI-powered discovery",
      "Priority deletion templates",
      "Advanced analytics",
      "Email support",
      "Export reports",
    ],
    cta: "Join Waitlist",
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$99",
    description: "One-time payment, forever access",
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Priority support",
      "Early access to features",
      "Remove branding",
    ],
    cta: "Join Waitlist",
    popular: false,
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
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent">
                  Most Popular
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
                </div>
              </CardHeader>
              <CardContent>
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
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </section>
  );
};
