import { useEffect, useMemo, useState } from "react";
import { Mail, Globe, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

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
 *  - Broker card: 4 fields inline → on save → fires scan-brokers immediately.
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [savingBroker, setSavingBroker] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
      if (cancelled || !profile) {
        setProfileLoaded(true);
        return;
      }
      const names = (profile.full_name || "").trim().split(/\s+/).filter(Boolean);
      if (names[0]) setFirstName(names[0]);
      if (names.length >= 2) setLastName(names.slice(1).join(" "));
      if (profile.city) setCity(profile.city);
      if (profile.state) setState(profile.state);
      setProfileLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const brokerReady = useMemo(
    () => firstName.trim().length > 0 && lastName.trim().length > 0 && city.trim().length > 0 && state.length > 0,
    [firstName, lastName, city, state],
  );

  const handleSaveAndScan = async () => {
    if (!brokerReady || savingBroker) return;
    setSavingBroker(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          city: city.trim(),
          state,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);
      if (error) throw error;

      // Input = trigger. Fire the scan immediately, no separate button.
      await onTriggerBrokerScan({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim(),
        state,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start broker scan";
      toast({ variant: "destructive", title: "Couldn't start scan", description: msg });
      setSavingBroker(false);
    }
  };

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
                  4 fields. Scan fires the moment the last one is filled.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="pcs-fn" className="text-[11px]">First name</Label>
                    <Input
                      id="pcs-fn"
                      className="h-8 text-sm"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={savingBroker || !profileLoaded}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pcs-ln" className="text-[11px]">Last name</Label>
                    <Input
                      id="pcs-ln"
                      className="h-8 text-sm"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={savingBroker || !profileLoaded}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pcs-city" className="text-[11px]">City</Label>
                    <Input
                      id="pcs-city"
                      className="h-8 text-sm"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={savingBroker || !profileLoaded}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pcs-state" className="text-[11px]">State</Label>
                    <Select value={state} onValueChange={setState} disabled={savingBroker || !profileLoaded}>
                      <SelectTrigger id="pcs-state" className="h-8 text-sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3"
                  disabled={!brokerReady || savingBroker}
                  onClick={handleSaveAndScan}
                >
                  {savingBroker ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting scan…</>
                  ) : brokerReady ? (
                    "Save → scan starts"
                  ) : (
                    "Fill the 4 fields above"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
