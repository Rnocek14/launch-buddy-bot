import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertTriangle, Mail, Sparkles, ShieldCheck, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Step = {
  key: string;
  label: string;
  done: boolean;
};

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [phase, setPhase] = useState<"running" | "handing-off" | "error" | "fallback">("running");
  const [email, setEmail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([
    { key: "payment", label: "Payment confirmed", done: false },
    { key: "account", label: "Account created", done: false },
    { key: "scan", label: "Deep scan starting", done: false },
  ]);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const markDone = (key: string) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, done: true } : s)));

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
        // Step 1: payment confirmed (immediate visual ack)
        await new Promise((r) => setTimeout(r, 500));
        if (cancelled) return;
        markDone("payment");

        // Step 2: provision account on the server
        const { data, error } = await supabase.functions.invoke("finalize-payment", {
          body: { sessionId },
        });
        if (cancelled) return;

        if (error || !data?.ok) {
          throw new Error(data?.error || error?.message || "Could not finalize sign-in");
        }

        setEmail(data.email || "");
        setMagicLink(data.magicLink || null);
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;
        markDone("account");

        // Step 3: scan starting (visual moment before handoff)
        await new Promise((r) => setTimeout(r, 800));
        if (cancelled) return;
        markDone("scan");

        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) return;

        if (data.magicLink) {
          setPhase("handing-off");
          // Brief pause so user sees the "all done" moment
          await new Promise((r) => setTimeout(r, 500));
          if (cancelled) return;
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

  const allDone = steps.every((s) => s.done);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-primary/5 px-4">
      <Card className="max-w-md w-full border-primary/20 shadow-xl shadow-primary/5">
        <CardContent className="p-8 space-y-6">
          {(phase === "running" || phase === "handing-off") && (
            <>
              <div className="text-center space-y-3">
                <div className="relative w-16 h-16 mx-auto">
                  <div className={`absolute inset-0 rounded-full bg-primary/10 ${allDone ? "" : "animate-ping"}`} />
                  <div className="relative w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                    {allDone ? (
                      <Sparkles className="w-8 h-8 text-primary" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-primary" />
                    )}
                  </div>
                </div>
                <h1 className="text-2xl font-semibold">
                  {allDone ? "You're protected." : "Setting up your protection…"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {allDone
                    ? "Taking you to your dashboard now."
                    : "This takes about 10 seconds."}
                </p>
              </div>

              {/* Step list — animates as each completes */}
              <ul className="space-y-3">
                {steps.map((step, idx) => {
                  const isActive = !step.done && steps.slice(0, idx).every((s) => s.done);
                  return (
                    <li
                      key={step.key}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 ${
                        step.done
                          ? "bg-emerald-500/10 text-foreground"
                          : isActive
                            ? "bg-primary/5 text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      <span className="flex-shrink-0">
                        {step.done ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </span>
                      <span className="text-sm font-medium">{step.label}</span>
                    </li>
                  );
                })}
              </ul>

              {email && allDone && (
                <p className="text-xs text-center text-muted-foreground">
                  Signed in as <strong className="text-foreground">{email}</strong>
                </p>
              )}
            </>
          )}

          {phase === "fallback" && (
            <div className="text-center space-y-3">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to <strong>{email}</strong>. Open it to access your dashboard.
              </p>
              {magicLink && (
                <Button onClick={() => (window.location.href = magicLink)} className="w-full">
                  Open my dashboard
                </Button>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="text-center space-y-3">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
              <h1 className="text-xl font-semibold">Payment received</h1>
              <p className="text-sm text-muted-foreground">
                Your payment went through, but we hit a snag signing you in.
                {errorMsg && <span className="block mt-1 text-xs">{errorMsg}</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                Use "Sign in" with the email you paid with — your account is ready.
              </p>
              <Button onClick={() => (window.location.href = "/auth")} className="w-full">
                Go to sign in
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
