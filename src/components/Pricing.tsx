import { useState } from "react";
import { Check, Crown, Shield, Star, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";
import { BillingToggle } from "./BillingToggle";
import type { BillingInterval } from "@/config/pricing";
import { FREE_FEATURES, PRO_FEATURES, COMPLETE_FEATURES, FAMILY_FEATURES, STRIPE_PRICES } from "@/config/pricing";

const getPlans = (billingInterval: BillingInterval) => [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Perfect for getting started",
    features: [...FREE_FEATURES],
    cta: "Get Started Free",
    ctaLink: "/auth",
    popular: false,
    icon: Shield,
  },
  {
    name: "Pro",
    price: billingInterval === "year" ? "$79" : "$12.99",
    period: billingInterval === "year" ? "/year" : "/month",
    description: "Continuous monitoring + unlimited cleanup",
    features: [...PRO_FEATURES],
    cta: "Start Monitoring",
    ctaLink: `/subscribe?tier=pro&interval=${billingInterval}`,
    popular: true,
    icon: Star,
    badge: billingInterval === "year" ? "Save 39%" : null,
    monthlyEquivalent: billingInterval === "year" ? "Just $6.58/month" : null,
  },
  {
    name: "Complete",
    price: billingInterval === "year" ? "$129" : "$19.99",
    period: billingInterval === "year" ? "/year" : "/month",
    description: "Full monitoring + data broker removal",
    features: [...COMPLETE_FEATURES],
    cta: "Get Complete Protection",
    ctaLink: `/subscribe?tier=complete&interval=${billingInterval}`,
    popular: false,
    icon: Crown,
    badge: billingInterval === "year" ? "Best Value" : null,
    monthlyEquivalent: billingInterval === "year" ? "Just $10.75/month" : null,
  },
  {
    name: "Family",
    price: "$179",
    period: "/year",
    description: "Protect up to 5 family members",
    features: [...FAMILY_FEATURES],
    cta: "Protect My Family",
    ctaLink: `/subscribe?tier=family&interval=year`,
    popular: false,
    icon: Users,
    badge: "Best for Families",
    monthlyEquivalent: "Just $2.98/member/month",
  },
];

const pricingFaq = [
  {
    question: "What's the difference between Pro and Complete?",
    answer:
      "Pro gives you unlimited deletion requests and deep AI scanning for service accounts (Netflix, Uber, shopping sites). Complete adds data broker scanning — we check 20+ sites that sell your personal info and guide you through removal."
  },
  {
    question: "Is there a free version?",
    answer:
      "Yes. You can use Footprint Finder for free with 1 email, 3 deletion requests/month, and basic scans. Upgrade to Pro or Complete to unlock more features."
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel your subscription at any time from the Billing page. When you cancel, you'll keep your features until the end of your current billing period."
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We don't offer automatic refunds, but if something goes wrong or the product doesn't work as promised, reach out to support and we'll make it right."
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Yes. All payments are processed by Stripe. We never see or store your full card details on our servers."
  }
];

const competitors = [
  {
    name: "DeleteMe",
    price: "$129/year",
    focus: "Data brokers only",
    description: "Removes you from data broker sites. Great for that, but doesn't handle service accounts.",
    highlight: false,
  },
  {
    name: "Incogni",
    price: "$77/year",
    focus: "Data brokers only",
    description: "Similar to DeleteMe — focuses on data broker removal. No inbox scanning.",
    highlight: false,
  },
  {
    name: "Mine (SayMine)",
    price: "Free–$99/year",
    focus: "Account discovery",
    description: "Closest to us. Scans your inbox, finds accounts. Less aggressive contact discovery.",
    highlight: false,
  },
  {
    name: "Footprint Finder",
    price: "$79–$129/year",
    focus: "Service accounts + brokers",
    description: "Deep AI scan + data broker removal. The complete privacy solution at competitive pricing.",
    highlight: true,
  },
];

export const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("year");
  const plans = getPlans(billingInterval);

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="container max-w-6xl">
        {/* Launch Pricing Banner */}
        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3 text-xs md:text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <span className="font-medium">Three simple plans:</span>{" "}
            Free to start, <span className="font-semibold">Pro at $79/year</span>, or <span className="font-semibold">Complete at $129/year</span> for everything.
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 font-medium">
            No hidden fees • Cancel anytime
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Subscribe to Stay Protected
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your exposure changes every month. So does your protection. Cancel anytime.
          </p>
        </div>

        <BillingToggle value={billingInterval} onChange={setBillingInterval} />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={index}
                className={`relative ${
                  plan.popular 
                    ? "border-primary shadow-lg shadow-primary/10 scale-105 z-10" 
                    : "border-border/50"
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent">
                    {plan.badge}
                  </Badge>
                )}
                {plan.popular && (
                  <Badge className="absolute -top-3 right-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                    {plan.monthlyEquivalent && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.monthlyEquivalent}
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
            );
          })}
        </div>

        <p className="text-center text-muted-foreground mt-12">
          ✨ All plans include our core privacy features. Cancel anytime.
        </p>

        {/* Named Competitor Comparison */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-4">
            How we compare to the competition
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            There are several privacy services out there. Here's how Footprint Finder stacks up — honestly.
          </p>

          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-4 bg-muted/40 text-xs font-medium uppercase tracking-wide py-3 px-4">
              <div>Service</div>
              <div>Price</div>
              <div>Focus</div>
              <div>Details</div>
            </div>

            {competitors.map((comp, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-4 border-t px-4 py-4 text-sm ${
                  comp.highlight ? "bg-accent/5" : ""
                }`}
              >
                <div className="font-semibold flex items-center gap-2">
                  {comp.name}
                  {comp.highlight && (
                    <Badge className="text-xs bg-accent/20 text-accent-foreground hover:bg-accent/20">
                      You are here
                    </Badge>
                  )}
                </div>
                <div className={comp.highlight ? "text-accent font-semibold" : "text-muted-foreground"}>
                  {comp.price}
                </div>
                <div className="text-muted-foreground">{comp.focus}</div>
                <div className="text-muted-foreground">{comp.description}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            <strong>Note:</strong> DeleteMe and Incogni focus on data brokers (sites that sell your personal info). Our Complete plan includes both service account discovery AND data broker removal.
          </p>
        </section>

        {/* Pricing FAQ */}
        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold mb-4">Pricing FAQ</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Answers to the most common questions about our plans.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {pricingFaq.map((item) => (
              <div key={item.question}>
                <h3 className="font-medium mb-1">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
