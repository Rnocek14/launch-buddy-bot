import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertTriangle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [phase, setPhase] = useState<"verifying" | "signing-in" | "error" | "fallback">("verifying");
  const [email, setEmail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setPhase("error");
      setErrorMsg("Missing session reference. Please check your email for confirmation.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Brief delay so Stripe webhook + finalize have a moment to settle
        await new Promise((r) => setTimeout(r, 800));

        const { data, error } = await supabase.functions.invoke("finalize-payment", {
          body: { sessionId },
        });
        if (cancelled) return;

        if (error || !data?.ok) {
          throw new Error(data?.error || error?.message || "Could not finalize sign-in");
        }

        setEmail(data.email || "");
        setPhase("signing-in");

        // Hand off to magic link — lands them logged in on /dashboard?welcome=1
        if (data.magicLink) {
          window.location.replace(data.magicLink);
        } else {
          setPhase("fallback");
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("payment-success finalize error", err);
        setErrorMsg(err?.message || "Something went wrong");
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          {phase === "verifying" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
              <h1 className="text-xl font-semibold">Confirming your payment…</h1>
              <p className="text-sm text-muted-foreground">
                Setting up your account and starting your scans.
              </p>
            </>
          )}

          {phase === "signing-in" && (
            <>
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <h1 className="text-xl font-semibold">Payment complete — signing you in…</h1>
              <p className="text-sm text-muted-foreground">
                Taking you to your dashboard.
              </p>
            </>
          )}

          {phase === "fallback" && (
            <>
              <Mail className="w-10 h-10 mx-auto text-primary" />
              <h1 className="text-xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to <strong>{email}</strong>. Open it to access your dashboard.
              </p>
            </>
          )}

          {phase === "error" && (
            <>
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
              <h1 className="text-xl font-semibold">Payment received</h1>
              <p className="text-sm text-muted-foreground">
                Your payment went through, but we hit a snag signing you in.
                {errorMsg && <span className="block mt-1 text-xs">{errorMsg}</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                Use "Sign in" with the email you paid with — your account is ready.
              </p>
              <Button onClick={() => (window.location.href = "/auth")}>Go to sign in</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
