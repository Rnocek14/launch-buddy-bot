import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";
import { BillingToggle } from "./BillingToggle";
import type { BillingInterval } from "@/config/pricing";

const getPlans = (billingInterval: BillingInterval) => [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Connect and scan 1 email account",
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
    price: billingInterval === "year" ? "$49" : "$9.99",
    period: billingInterval === "year" ? "/year" : "/month",
    description: "Unlimited deletions + deep discovery that finds 2-3× more",
    features: [
      "Everything in Free, plus:",
      "Unlimited deletion requests",
      "Deep AI Scan (finds 2-3× more accounts)",
      "Connect and scan up to 3 email addresses",
      "Complete inbox history analysis",
      "Priority deletion processing",
      "Monthly automatic rescans",
      "Priority email support",
    ],
    cta: billingInterval === "year" ? "Upgrade to Pro" : "Start Pro Monthly",
    ctaLink: `/subscribe?interval=${billingInterval}`,
    popular: true,
    available: true,
    badge: billingInterval === "year" ? "Launch pricing — Save 59%" : null,
    monthlyEquivalent: billingInterval === "year" ? "Just $4/month" : null,
  },
];

const pricingFaq = [
  {
    question: "Is there a free version?",
    answer:
      "Yes. You can use Footprint Finder for free with up to 3 deletion requests and basic scans. The Pro plan unlocks unlimited deletions, deep scans, and up to 3 connected email accounts."
  },
  {
    question: "Is $49 billed monthly or yearly?",
    answer:
      "$49 is billed once per year. It works out to about $4 per month, but you're only charged once annually, not every month. We also offer a $9.99/month option if you prefer."
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel your Pro subscription at any time from the Billing page. When you cancel, you'll keep Pro features until the end of your current billing period and won't be charged again."
  },
  {
    question: "Will my price ever go up?",
    answer:
      "Early adopters lock in the $49/year launch pricing. If we raise prices in the future, existing Pro members keep their original rate as long as they stay subscribed."
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We don't offer automatic refunds, but if something goes wrong or the product doesn't work as promised for you, reach out to support and we'll make it right."
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
    description: "Removes you from data broker sites. Great for that, but doesn't handle service accounts (Netflix, Uber, old shopping sites, etc.).",
    highlight: false,
  },
  {
    name: "Incogni",
    price: "$77/year",
    focus: "Data brokers only",
    description: "Similar to DeleteMe — focuses on data broker removal. Automated, hands-off approach. No inbox scanning or account discovery.",
    highlight: false,
  },
  {
    name: "Mine (SayMine)",
    price: "Free–$99/year",
    focus: "Account discovery",
    description: "Closest to us. Scans your inbox, finds accounts. Free tier is limited. Less aggressive contact discovery than our AI scan.",
    highlight: false,
  },
  {
    name: "Footprint Finder",
    price: "$49/year or $9.99/mo",
    focus: "Service accounts",
    description: "Deep AI scan of your inbox to find forgotten accounts. Unlimited deletion requests. Finds 2-3× more accounts with Pro. Monthly rescans included.",
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
            <span className="font-medium">Launch special:</span>{" "}
            Lock in <span className="font-semibold">$49/year</span> Pro pricing.
            Your rate won't increase as long as you keep your subscription active.
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 font-medium">
            No hidden fees • Cancel anytime
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your privacy needs. No hidden fees.
          </p>
        </div>

        <BillingToggle value={billingInterval} onChange={setBillingInterval} />

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${
                plan.popular 
                  ? "border-primary shadow-lg shadow-primary/10 scale-105" 
                  : "border-border/50"
              } ${!plan.available ? "opacity-75" : ""}`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent">
                  {plan.badge}
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
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-12">
          ✨ Limited launch pricing — lock in $49/year forever. Cancel anytime.
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
            <strong>Note:</strong> DeleteMe and Incogni focus on data brokers (sites that sell your personal info). We focus on service accounts — the companies you've signed up with. Different problems, complementary solutions.
          </p>
        </section>

        {/* Pricing FAQ */}
        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold mb-4">Pricing FAQ</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Answers to the most common questions about Footprint Finder Pro.
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
