import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free Beta",
    price: "$0",
    description: "Full access during our beta launch",
    features: [
      "Unlimited service scanning",
      "All deletion request features",
      "Email support",
      "Standard templates",
      "Help shape the product",
    ],
    cta: "Join Beta",
    popular: true,
    available: true,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For serious privacy advocates",
    features: [
      "Everything in Free Beta",
      "Priority deletion requests",
      "AI-powered discovery",
      "Custom email templates",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Coming Soon",
    popular: false,
    available: false,
  },
  {
    name: "Lifetime",
    price: "$299",
    description: "One-time payment, forever access",
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Priority feature requests",
      "Dedicated support channel",
      "Early access to new features",
      "No recurring fees ever",
    ],
    cta: "Coming Soon",
    popular: false,
    available: false,
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
                  Most Popular
                </Badge>
              )}
              {!plan.available && (
                <Badge variant="secondary" className="absolute -top-3 right-4">
                  Coming Soon
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
                {plan.available ? (
                  <Link to="/auth" className="w-full">
                    <Button 
                      className={`w-full mb-6 ${
                        plan.popular 
                          ? "bg-primary hover:bg-primary/90" 
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get Started Free
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    className="w-full mb-6"
                    variant="outline"
                    disabled
                  >
                    {plan.cta}
                  </Button>
                )}
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
