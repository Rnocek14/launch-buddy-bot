import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, Lock, CheckCircle2 } from "lucide-react";
import {
  getPersistedGuestEmail,
  persistGuestEmail,
  startCheckout,
  type CheckoutSource,
} from "@/lib/checkout";
import { useToast } from "@/hooks/use-toast";

interface QuickCheckoutEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceId: string;
  source: CheckoutSource;
  tier?: string;
  /** Headline shown above the email input. */
  title?: string;
  description?: string;
}

/**
 * Minimal email-collection step shown ONLY when a guest clicks a paid CTA
 * without having entered an email upstream. One field, one button, straight
 * to Stripe Checkout. Account is auto-created post-payment via magic link.
 */
export function QuickCheckoutEmailDialog({
  open,
  onOpenChange,
  priceId,
  source,
  tier,
  title = "Almost there",
  description = "Enter your email and we'll take you straight to secure checkout.",
}: QuickCheckoutEmailDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(getPersistedGuestEmail());
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    persistGuestEmail(email);
    const result = await startCheckout({ priceId, email, source, tier });
    if (result.status === "error") {
      toast({
        title: "Couldn't start checkout",
        description: result.message,
        variant: "destructive",
      });
      setLoading(false);
    }
    // "redirecting" -> page is about to unload, nothing to do
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            className="h-12 text-base"
            required
          />

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening secure checkout…
              </>
            ) : (
              <>
                Continue to secure checkout
              </>
            )}
          </Button>

          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Secure checkout powered by <span className="font-medium text-foreground">Stripe</span> — we never see your card details.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>We never sell or share your personal data.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>30-day money-back guarantee · account auto-created · cancel anytime.</span>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
