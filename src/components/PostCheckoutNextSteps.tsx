import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Globe, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** Currently connected Gmail/Outlook? Drives the Gmail card state. */
  hasEmailConnection: boolean;
  /** Has any broker scan been started? Drives the broker card state. */
  hasBrokerScan: boolean;
  /** Whether broker scan is allowed for this tier (Complete only). */
  brokerScanEnabled: boolean;
  /** Trigger inbox scan — should be the same handleScan() Dashboard exposes. */
  onTriggerInboxScan: () => void;
  /** Trigger broker scan after profile is saved. */
  onTriggerBrokerScan: (profile: { firstName: string; lastName: string; city: string; state: string }) => Promise<void> | void;
  /** Open Gmail OAuth flow (re-uses the existing edge function pattern). */
  onConnectGmail: () => void;
}

/**
 * Renders right after the post-checkout scan animation dismisses.
 *
 * Core principle: input = trigger. No "Scan" button.
 *  - Gmail card: one click → OAuth → on return Dashboard auto-fires the scan.
 *  - Broker card: 2 fields (Full name + ZIP) → ZIP resolves city/state →
 *    scan auto-fires the moment the inputs are valid. No "Save" click required.
 *
 * Auto-hides itself once both flows are in motion (or already complete).
 */
export function PostCheckoutNextSteps({
  hasEmailConnection,
  hasBrokerScan,
  brokerScanEnabled,
  onTriggerInboxScan,
  onTriggerBrokerScan,
  onConnectGmail,
}: Props) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [zip, setZip] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{ city: string; state: string } | null>(null);
  const [resolvingZip, setResolvingZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [autoTriggering, setAutoTriggering] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const triggeredRef = useRef(false); // Guard so we only auto-trigger once.

  // Pre-fill from profile so a returning user only fills missing fields.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, city, state")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.city && profile?.state) {
        setResolvedLocation({ city: profile.city, state: profile.state });
      }
      setProfileLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Resolve ZIP → city/state via Zippopotam (free, no API key, US only).
  // Debounced so we don't fire on every keystroke.
  useEffect(() => {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setResolvedLocation((prev) => (zip.length === 0 ? prev : null));
      setZipError(null);
      return;
    }
    setResolvingZip(true);
    setZipError(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${trimmed}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("ZIP not found");
        const json = await res.json();
        const place = json?.places?.[0];
        if (!place) throw new Error("ZIP not found");
        setResolvedLocation({
          city: place["place name"],
          state: place["state abbreviation"],
        });
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        setZipError("We couldn't find that ZIP. Double-check it.");
        setResolvedLocation(null);
      } finally {
        setResolvingZip(false);
      }
    }, 350);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [zip]);

  const splitName = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }, [fullName]);

  const brokerReady = !!splitName && !!resolvedLocation && !resolvingZip;

  // Input = trigger. The moment the inputs become valid, fire the scan.
  // No "Save → scan" two-step. Guarded by triggeredRef so this only runs once.
  useEffect(() => {
    if (!brokerReady || triggeredRef.current || autoTriggering || hasBrokerScan) return;
    if (!brokerScanEnabled) return;
    triggeredRef.current = true;
    setAutoTriggering(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not signed in");

        // Persist to the profile in the background so the rest of the app picks it up.
        await supabase
          .from("profiles")
          .update({
            full_name: `${splitName!.firstName} ${splitName!.lastName}`,
            city: resolvedLocation!.city,
            state: resolvedLocation!.state,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id);

        await onTriggerBrokerScan({
          firstName: splitName!.firstName,
          lastName: splitName!.lastName,
          city: resolvedLocation!.city,
          state: resolvedLocation!.state,
        });
      } catch (err) {
        triggeredRef.current = false; // Allow retry if it failed.
        const msg = err instanceof Error ? err.message : "Could not start broker scan";
        toast({ variant: "destructive", title: "Couldn't start scan", description: msg });
      } finally {
        setAutoTriggering(false);
      }
    })();
  }, [brokerReady, brokerScanEnabled, hasBrokerScan, splitName, resolvedLocation, autoTriggering, onTriggerBrokerScan, toast]);

  // If everything that *can* run is already running/done, this panel has nothing left to offer.
  const everythingInMotion =
    hasEmailConnection && (hasBrokerScan || !brokerScanEnabled);
  if (everythingInMotion) return null;

  return (
    <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">We started your scan. Let's finish the rest.</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Each step below kicks off automatically — no extra buttons.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* ───────── Gmail card ───────── */}
          <div
            className={`rounded-lg border p-4 transition-colors ${
              hasEmailConnection ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">Connect your inbox</h3>
              {hasEmailConnection && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Surfaces hidden accounts (Netflix, Amazon, old subscriptions). Scan starts the moment you connect.
            </p>
            {hasEmailConnection ? (
              <Button size="sm" variant="outline" className="w-full" onClick={onTriggerInboxScan}>
                Re-scan inbox
              </Button>
            ) : (
              <Button size="sm" className="w-full" onClick={onConnectGmail}>
                <Mail className="h-4 w-4 mr-2" />
                Connect Gmail → scan starts
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              We only read sender + subject. Never the body.
            </p>
          </div>

          {/* ───────── Broker card ───────── */}
          <div
            className={`rounded-lg border p-4 transition-colors ${
              hasBrokerScan ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">Find your broker exposure</h3>
              {hasBrokerScan && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
            </div>

            {!brokerScanEnabled ? (
              <p className="text-xs text-muted-foreground">
                Broker monitoring is part of the Complete plan.
              </p>
            ) : hasBrokerScan ? (
              <p className="text-xs text-muted-foreground">
                Broker scan is running below. Results populate automatically.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Two fields. Scan fires the moment both are valid.
                </p>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="pcs-name" className="text-[11px]">Full name</Label>
                    <Input
                      id="pcs-name"
                      className="h-9 text-sm"
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!profileLoaded || autoTriggering}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pcs-zip" className="text-[11px]">ZIP code</Label>
                    <div className="relative">
                      <Input
                        id="pcs-zip"
                        className="h-9 text-sm pr-9"
                        placeholder="10001"
                        inputMode="numeric"
                        maxLength={5}
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        disabled={!profileLoaded || autoTriggering}
                        autoComplete="postal-code"
                      />
                      {resolvingZip && (
                        <Loader2 className="h-4 w-4 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      )}
                      {!resolvingZip && resolvedLocation && (
                        <CheckCircle2 className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                      )}
                    </div>
                    {resolvedLocation && !zipError && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {resolvedLocation.city}, {resolvedLocation.state}
                      </p>
                    )}
                    {zipError && (
                      <p className="text-[11px] text-destructive mt-1">{zipError}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground min-h-[20px]">
                  {autoTriggering ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Starting broker scan…</>
                  ) : brokerReady ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Locking in your details…</>
                  ) : (
                    <span>Fill both fields — the scan fires automatically.</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
