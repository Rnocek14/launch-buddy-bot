import React, { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import {
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
  Loader2,
  Megaphone,
  Youtube,
  FileText,
  Globe,
} from "lucide-react";

const COMMISSION_RATE = 0.4; // 40% recurring
const ANNUAL_PRICE = 79;
const MONTHLY_PRICE = 15;

export default function Affiliates() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    payout_email: "",
    website_url: "",
    audience_description: "",
    promotion_channels: [] as string[],
  });

  const channels = [
    { id: "blog", label: "Blog / SEO", icon: FileText },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "social", label: "Social media", icon: Megaphone },
    { id: "newsletter", label: "Newsletter", icon: Globe },
  ];

  const toggleChannel = (id: string) => {
    setForm((f) => ({
      ...f,
      promotion_channels: f.promotion_channels.includes(id)
        ? f.promotion_channels.filter((c) => c !== id)
        : [...f.promotion_channels, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.audience_description.trim()) {
      toast({ title: "Missing fields", description: "Please fill in name, email, and audience.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: code } = await supabase.rpc("generate_affiliate_code");
      if (!code) throw new Error("Could not generate referral code");

      const { error } = await supabase.from("affiliates").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        payout_email: form.payout_email.trim().toLowerCase() || form.email.trim().toLowerCase(),
        website_url: form.website_url.trim() || null,
        audience_description: form.audience_description.trim(),
        promotion_channels: form.promotion_channels,
        code,
        commission_rate: COMMISSION_RATE,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("An application with this email already exists.");
        }
        throw error;
      }

      trackEvent("affiliate_application_submitted", { channels: form.promotion_channels });
      setSubmitted(true);
      toast({ title: "Application received!", description: "We'll review and email you within 48 hours." });
    } catch (err: any) {
      toast({ title: "Could not submit", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Earnings projection: assume 40% recurring, conservative 5% conversion
  const exampleClicks = 1000;
  const exampleConversions = Math.round(exampleClicks * 0.05);
  const exampleAnnual = exampleConversions * ANNUAL_PRICE * COMMISSION_RATE;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Affiliate Program — Earn 40% Recurring | Deleteist</title>
        <meta
          name="description"
          content="Promote Deleteist privacy protection and earn 40% recurring commission on every subscription. Join the affiliate program."
        />
        <link rel="canonical" href="https://footprintfinder.co/affiliates" />
      </Helmet>

      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1.5">
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />
              40% Recurring Commission
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Earn recurring revenue
              <br />
              <span className="text-primary">promoting online privacy</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Privacy is a $4B market growing 20% per year. Join the Deleteist affiliate program and earn 40% recurring on every subscription you refer — for as long as they stay.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Badge variant="outline" className="px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                90-day cookie
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Monthly payouts
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Free assets & copy
              </Badge>
            </div>
          </div>
        </section>

        {/* Earnings calculator */}
        <section className="container mx-auto px-4 pb-16 max-w-5xl">
          <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">If you send</div>
                  <div className="text-4xl font-bold">{exampleClicks.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">visitors / month</div>
                </div>
                <div className="border-x border-border md:px-8">
                  <div className="text-sm text-muted-foreground mb-2">At 5% conversion</div>
                  <div className="text-4xl font-bold">{exampleConversions}</div>
                  <div className="text-sm text-muted-foreground">paying customers</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">You earn</div>
                  <div className="text-4xl font-bold text-primary">
                    ${exampleAnnual.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">recurring / year</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-6">
                Based on 40% commission of $79/yr plan. Subscribers stay an average of 18+ months.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                icon: Zap,
                title: "Apply in 60 seconds",
                desc: "Tell us about your audience. We approve most applications within 48 hours.",
              },
              {
                step: 2,
                icon: Megaphone,
                title: "Promote with assets we provide",
                desc: "Pre-written copy, comparison angles, screenshots, and ranking keywords. No guesswork.",
              },
              {
                step: 3,
                icon: TrendingUp,
                title: "Earn 40% recurring forever",
                desc: "Monthly Stripe payouts. As long as they stay subscribed, you keep earning.",
              },
            ].map((s) => (
              <Card key={s.step} className="relative">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="outline">Step {s.step}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why this works */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Why Deleteist converts</h2>
              <ul className="space-y-3">
                {[
                  "Free scan finds breaches & exposed data instantly — perfect hook",
                  "Real emotional stakes: parents, scams, identity theft",
                  "Subscriptions sticky: people don't unsubscribe from privacy",
                  "Family plan & one-time options widen your audience",
                  "Strong landing pages built for conversion",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-muted/30">
              <CardContent className="p-8 space-y-4">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Best content angles
                </div>
                <div className="space-y-3">
                  {[
                    '"Best Incogni alternative in 2026"',
                    '"How to remove yourself from data brokers"',
                    '"I scanned my email — here\'s what I found"',
                    '"Protecting elderly parents from scam calls"',
                    '"Privacy tools that actually work"',
                  ].map((angle) => (
                    <div key={angle} className="flex items-center gap-3 text-sm">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>{angle}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Application form */}
        <section id="apply" className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="border-primary/20">
            <CardContent className="p-8 md:p-10">
              {submitted ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Application received!</h2>
                  <p className="text-muted-foreground">
                    We'll review and email you within 48 hours with your unique referral link and onboarding kit.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold mb-2">Apply now</h2>
                    <p className="text-muted-foreground">Takes 60 seconds. Most approved within 48 hours.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name *</Label>
                        <Input
                          id="name"
                          required
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website / main channel URL</Label>
                      <Input
                        id="website"
                        placeholder="https://..."
                        value={form.website_url}
                        onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>How will you promote? (select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {channels.map((c) => {
                          const active = form.promotion_channels.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleChannel(c.id)}
                              className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                                active
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border bg-background hover:bg-muted/50"
                              }`}
                            >
                              <c.icon className="w-4 h-4" />
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audience">Tell us about your audience *</Label>
                      <Textarea
                        id="audience"
                        required
                        rows={4}
                        placeholder="e.g. I run a privacy-focused newsletter with 12k subscribers, mostly US-based professionals concerned about data brokers."
                        value={form.audience_description}
                        onChange={(e) => setForm({ ...form, audience_description: e.target.value })}
                        maxLength={1000}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payout">Payout email (if different)</Label>
                      <Input
                        id="payout"
                        type="email"
                        placeholder="paypal@example.com"
                        value={form.payout_email}
                        onChange={(e) => setForm({ ...form, payout_email: e.target.value })}
                        maxLength={255}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Apply to the program"
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By applying you agree to our affiliate terms. Minimum payout $50.
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "How long is the cookie window?",
                a: "90 days. If someone clicks your link and signs up within 90 days, the conversion is yours.",
              },
              {
                q: "When do I get paid?",
                a: "Monthly via Stripe Connect or PayPal, once you reach the $50 minimum threshold. Commissions clear after a 30-day refund window.",
              },
              {
                q: "What about refunds?",
                a: "If a customer refunds within 30 days, the commission is reversed. After 30 days, your earnings are locked in.",
              },
              {
                q: "Can I run paid ads?",
                a: "Yes — except branded keywords (\"Deleteist\", \"Footprint Finder\"). We'll send full guidelines on approval.",
              },
              {
                q: "Do you provide creative assets?",
                a: "Yes. On approval you get pre-written blog templates, comparison angles, screenshots, banners, and target keywords.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-border pb-6">
                <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
