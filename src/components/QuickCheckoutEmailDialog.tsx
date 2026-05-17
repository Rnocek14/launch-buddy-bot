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
import { Loader2, Shield, Lock } from "lucide-react";
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

          <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            Pay first · account auto-created · 30-day refund · cancel anytime
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
