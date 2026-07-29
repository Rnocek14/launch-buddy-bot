import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bell, CheckCircle2 } from "lucide-react";
import { captureLead, LEAD_CONSENT_COPY } from "@/lib/leadCapture";
import { trackEvent } from "@/lib/analytics";

interface AlertOptInProps {
  email: string;
  breachCount: number;
  source: string;
  sourceDetail?: string | null;
}

/**
 * Post-results opt-in.
 *
 * Placed after someone has seen their actual breach count, which is the point
 * of maximum motivation — and, importantly, the point at which they can judge
 * whether alerts are worth having. Asking before the scan means asking someone
 * to opt into alerts about a problem they have not yet been shown.
 *
 * It is a second ask, not a gate: the results above are already fully visible
 * and stay visible whether or not this is used. Nothing here is required to
 * see anything.
 */
export function AlertOptIn({
  email,
  breachCount,
  source,
  sourceDetail,
}: AlertOptInProps) {
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (saved) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm">
            Done — we'll email <strong>{email}</strong> if new exposure shows
            up. Every email has a one-click unsubscribe link.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!consent) return;
    setSaving(true);
    trackEvent("alert_opt_in", { source, breach_count: breachCount });
    await captureLead({ email, consented: true, source, sourceDetail });
    setSaving(false);
    setSaved(true);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold mb-1">Want to know if this gets worse?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Breaches and broker listings are not one-off events — brokers
              rebuild their databases from public records within months, and new
              breaches surface constantly. We can re-check this address and
              email you when something changes.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 mb-4">
          <Checkbox
            id="alert-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="alert-consent"
            className="text-sm font-normal text-muted-foreground leading-relaxed cursor-pointer"
          >
            {LEAD_CONSENT_COPY}
          </Label>
        </div>

        <Button onClick={handleSave} disabled={!consent || saving} size="sm">
          {saving ? "Saving…" : "Email me if anything changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
