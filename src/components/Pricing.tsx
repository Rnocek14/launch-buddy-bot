import { useState } from "react";
import { Shield, Star, Crown, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import type { BillingInterval } from "@/config/pricing";
import { FREE_FEATURES, PRO_FEATURES, COMPLETE_FEATURES, FAMILY_FEATURES, STRIPE_PRICES } from "@/config/pricing";
import { startCheckout, type CheckoutSource } from "@/lib/checkout";
import { QuickCheckoutEmailDialog } from "./QuickCheckoutEmailDialog";
import { useToast } from "@/hooks/use-toast";

// Two primary plans shown at decision moment — Pro (most popular) + Complete (recommended)
const getPrimaryPlans = (billingInterval: BillingInterval) => [
  {
    name: "Pro",
    tier: "pro" as const,
    priceId:
      billingInterval === "year"
        ? STRIPE_PRICES.PRO_ANNUAL.id
        : STRIPE_PRICES.PRO_MONTHLY.id,
    price: billingInterval === "year" ? "$79" : "$12.99",
    period: billingInterval === "year" ? "/year" : "/month",
    description: "Find every forgotten account and send deletion requests for you",
    features: [...PRO_FEATURES],
    cta: "Start cleaning up",
    popular: true,
    icon: Star,
    badge: billingInterval === "year" ? "Save 39%" : null,
    monthlyEquivalent: billingInterval === "year" ? "Just $6.58/month" : null,
  },
  {
    name: "Complete",
    tier: "complete" as const,
    priceId:
      billingInterval === "year"
        ? STRIPE_PRICES.COMPLETE_ANNUAL.id
        : STRIPE_PRICES.COMPLETE_MONTHLY.id,
    price: billingInterval === "year" ? "$129" : "$19.99",
    period: billingInterval === "year" ? "/year" : "/month",
    description: "Everything in Pro, plus guided broker opt-outs",
    features: [...COMPLETE_FEATURES],
    cta: "Add broker opt-outs",
    popular: false,
    icon: Crown,
    badge: billingInterval === "year" ? "Best Value" : null,
    monthlyEquivalent: billingInterval === "year" ? "Just $10.75/month" : null,
  },
];

// Secondary plans shown in a smaller "Not ready to pay?" row
const getSecondaryPlans = () => [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Basic scan to see your exposure",
    features: [...FREE_FEATURES],
    cta: "Start Free",
    ctaLink: "/free-scan",
    icon: Shield,
    badge: null as string | null,
  },
];

const pricingFaq = [
  {
    question: "What's the difference between Pro and Complete?",
    answer:
      "Pro gives you unlimited deletion requests and a full inbox scan for service accounts (Netflix, Uber, shopping sites). Complete adds data broker scanning — we check 20+ sites that sell your personal info and guide you through removal."
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
      "Yes — every paid plan comes with a 30-day money-back guarantee. If you're not satisfied within 30 days of your purchase, contact support and we'll issue a full refund. Cancel anytime after that and you'll keep your features through the end of your billing period."
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
    price: "$95.88/year",
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
    description: "Finds the accounts you forgot, sends deletion requests for you, plus guided broker opt-outs.",
    highlight: true,
  },
];

export const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("year");
  const primaryPlans = getPrimaryPlans(billingInterval);
  const secondaryPlans = getSecondaryPlans();
  const { toast } = useToast();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [emailDialogPlan, setEmailDialogPlan] = useState<{
    priceId: string;
    tier: string;
  } | null>(null);

  const handlePlanClick = async (
    priceId: string,
    tier: string,
    source: CheckoutSource = "pricing_page"
  ) => {
    setLoadingPriceId(priceId);
    const result = await startCheckout({ priceId, source, tier });
    if (result.status === "needs_email") {
      setEmailDialogPlan({ priceId, tier });
      setLoadingPriceId(null);
      return;
    }
    if (result.status === "error") {
      toast({
        title: "Couldn't start checkout",
        description: result.message,
        variant: "destructive",
      });
      setLoadingPriceId(null);
    }
    // redirecting -> page unloads
  };

  const Row = ({ label, title, children }: { label: string; title: string; children: React.ReactNode }) => (
    <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 py-16 lg:py-20 border-b border-border">
      <div className="lg:col-span-4">
        <p className="section-label mb-4">{label}</p>
        <h2 className="text-3xl sm:text-4xl leading-tight text-foreground">{title}</h2>
      </div>
      <div className="lg:col-span-8">{children}</div>
    </div>
  );

  return (
    <section id="pricing" className="px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <Row label="04 / Pricing" title="Two plans. Cancel anytime, full refund for 30 days.">
          <div className="flex items-center gap-4 mb-6 font-mono text-sm" role="group" aria-label="Billing period">
            {(["year", "month"] as BillingInterval[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setBillingInterval(i)}
                aria-pressed={billingInterval === i}
                className={`pb-1 border-b-2 ${billingInterval === i ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {i === "year" ? "Yearly" : "Monthly"}
              </button>
            ))}
            {billingInterval === "year" && <span className="text-muted-foreground">· about 4 months free</span>}
          </div>

          <div className="grid md:grid-cols-2 border-t border-l border-border">
            {primaryPlans.map((plan) => (
              <div key={plan.name} className="border-r border-b border-border p-6 flex flex-col">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="text-xl font-display font-semibold text-foreground">{plan.name}</h3>
                  {plan.popular && <span className="font-mono text-xs text-muted-foreground">most chosen</span>}
                </div>
                <p className="text-muted-foreground mb-5">{plan.description}</p>
                <p className="mb-1">
                  <span className="font-mono text-4xl text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </p>
                <p className="font-mono text-xs text-muted-foreground mb-6 h-4">
                  {plan.monthlyEquivalent ? plan.monthlyEquivalent.replace("Just ", "") : ""}
                </p>
                <ul className="mb-8 flex-1 border-t border-border">
                  {plan.features.map((f) => (
                    <li key={f} className="py-2 border-b border-border text-sm text-foreground">{f}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => handlePlanClick(plan.priceId, plan.tier)}
                  disabled={loadingPriceId === plan.priceId}
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full h-12 rounded-none"
                >
                  {loadingPriceId === plan.priceId ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening checkout…</> : plan.cta}
                </Button>
              </div>
            ))}
          </div>

          {secondaryPlans.map((plan) => (
            <p key={plan.name} className="mt-6 text-muted-foreground">
              Not ready to pay? The <Link to={plan.ctaLink} className="text-foreground underline underline-offset-4">free scan</Link> shows breaches and broker listings for your email.
            </p>
          ))}
        </Row>

        <Row label="05 / Compared" title="How we differ from the others.">
          <div className="border-t border-border">
            {competitors.map((comp) => (
              <div key={comp.name} className="grid sm:grid-cols-12 gap-2 sm:gap-4 py-4 border-b border-border">
                <div className="sm:col-span-3 font-medium text-foreground">
                  {comp.name}{comp.highlight && <span className="font-mono text-xs text-muted-foreground ml-2">(us)</span>}
                </div>
                <div className="sm:col-span-2 font-mono text-sm text-foreground">{comp.price}</div>
                <div className="sm:col-span-7 text-sm text-muted-foreground">{comp.description}</div>
              </div>
            ))}
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-4">Prices from each company's public pricing page, checked Nov 2026.</p>
        </Row>

        <Row label="06 / Billing questions" title="The money part, plainly.">
          <dl className="border-t border-border">
            {pricingFaq.map((item) => (
              <div key={item.question} className="py-5 border-b border-border">
                <dt className="font-medium text-foreground mb-1">{item.question}</dt>
                <dd className="text-muted-foreground leading-relaxed">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Row>
      </div>

      {emailDialogPlan && (
        <QuickCheckoutEmailDialog
          open={!!emailDialogPlan}
          onOpenChange={(open) => !open && setEmailDialogPlan(null)}
          priceId={emailDialogPlan.priceId}
          source="pricing_page"
          tier={emailDialogPlan.tier}
        />
      )}
    </section>
  );
};
