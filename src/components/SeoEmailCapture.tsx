import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

interface SeoEmailCaptureProps {
  brokerSlug: string;
  brokerName: string;
}

/**
 * Inline email capture for SEO landing pages.
 * Sends user straight into the free scan with their email pre-filled.
 * No password, no friction — just exposure report → conversion.
 */
export function SeoEmailCapture({ brokerSlug, brokerName }: SeoEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    setSubmitting(true);
    trackEvent("seo_broker_email_capture", {
      broker_slug: brokerSlug,
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
              {brokerName} is just <strong>one of 50+ sites</strong> that publish your info.
              Enter your email and we'll show you the rest — free.
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
