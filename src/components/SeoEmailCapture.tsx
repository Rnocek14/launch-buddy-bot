import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";
import { captureLead, LEAD_CONSENT_COPY } from "@/lib/leadCapture";

interface SeoEmailCaptureProps {
  brokerSlug: string;
  /** Named broker, when this sits on a /remove-from/:slug page. */
  brokerName?: string;
  /** Event name, so guide pages are distinguishable from broker pages. */
  event?: string;
  /** Lead-capture source label stored with a consenting address. */
  source?: string;
}

/**
 * Inline email capture for SEO landing pages.
 * Sends user straight into the free scan with their email pre-filled.
 *
 * `brokerName` is optional because this is used on two different page types.
 * Guide pages previously passed the literal string "the internet" to fill it,
 * which rendered as "the internet is just one of 50+ sites that publish your
 * info" — so the copy is now chosen by whether a broker was actually named.
 */
export function SeoEmailCapture({
  brokerSlug,
  brokerName,
  event = "seo_broker_email_capture",
  source = "seo_broker",
}: SeoEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    setSubmitting(true);
    trackEvent(event, { broker_slug: brokerSlug });
    // This form hands off to /free-scan, which auto-runs and so never shows
    // its own consent box. Without the checkbox below, every lead arriving
    // through an SEO page would bypass the opt-in entirely.
    void captureLead({
      email,
      consented: consent,
      source,
      sourceDetail: brokerSlug,
    });
    navigate(`/free-scan?email=${encodeURIComponent(email)}&src=seo_${brokerSlug}`);
  };

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/8 via-background to-accent/8">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">
              See where else you're exposed — in 60 seconds
            </h3>
            <p className="text-sm text-muted-foreground">
              {brokerName ? (
                <>
                  {brokerName} is just <strong>one of 50+ sites</strong> that publish
                  your info. Enter your email and we'll show you the rest — free.
                </>
              ) : (
                <>
                  Your details are published across <strong>50+ data-broker sites</strong>,
                  and most people can only name one or two. Enter your email and we'll
                  show you which ones — free.
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-3">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="gap-2 cta-shimmer whitespace-nowrap"
          >
            Get my exposure report
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-start gap-2.5 mb-3">
          <Checkbox
            id={`seo-consent-${brokerSlug}`}
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor={`seo-consent-${brokerSlug}`}
            className="text-xs font-normal text-muted-foreground leading-relaxed cursor-pointer"
          >
            {LEAD_CONSENT_COPY}
          </Label>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            No credit card
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            No password required
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
            Results in 60s
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
