import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Mail, Shield, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface StreamlinedOnboardingProps {
  onComplete: () => void;
}

export function StreamlinedOnboarding({ onComplete }: StreamlinedOnboardingProps) {
  const [step, setStep] = useState<'intro' | 'consent' | 'connecting' | 'complete'>('intro');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create a simplified authorization record
      const { error } = await supabase.from("user_authorizations").insert({
        user_id: user.id,
        jurisdiction: 'Global',
        consent_version: 'v1.0',
        signature_data: {
          text: 'Quick Onboarding',
          timestamp: new Date().toISOString(),
        },
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      setStep('connecting');
    } catch (error: any) {
      console.error("Authorization error:", error);
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to complete authorization.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-email-oauth-url', {
        body: { provider: 'gmail' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Gmail.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (step === 'intro') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Get Started in 2 Steps</CardTitle>
              <CardDescription className="text-base mt-1">
                Discover your digital footprint and take control of your privacy
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What happens */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Here's what will happen:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Quick Authorization</p>
                  <p className="text-sm text-muted-foreground">
                    Grant permission to send GDPR/CCPA deletion requests on your behalf
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Connect Your Gmail</p>
                  <p className="text-sm text-muted-foreground">
                    Scan your inbox to discover services automatically (read-only access)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="p-4 rounded-lg border border-border bg-background space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Your Privacy & Security
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-6">
              <li>• We never store email content—only service names</li>
              <li>• All tokens are encrypted</li>
              <li>• Read-only access—we can't send or delete emails</li>
              <li>• Disconnect anytime in Settings</li>
            </ul>
          </div>

          <Button 
            onClick={() => setStep('consent')} 
            size="lg" 
            className="w-full"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'consent') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authorization Agreement</CardTitle>
          <CardDescription>
            Review and accept to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-h-80 overflow-y-auto border rounded-lg p-4 bg-muted/30 space-y-3 text-sm">
            <p>
              By proceeding, you authorize Footprint Finder to:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Scan your connected email accounts to discover online services</li>
              <li>Send data deletion requests on your behalf under GDPR, CCPA, and similar privacy laws</li>
              <li>Use your email address in deletion request communications</li>
              <li>Track the status of your deletion requests</li>
            </ul>
            <p className="font-medium mt-4">Your Rights:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Revoke authorization at any time</li>
              <li>Full control over which services to contact</li>
              <li>Review communications sent on your behalf</li>
              <li>Disconnect email access anytime</li>
            </ul>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <Checkbox
              id="consent"
              checked={consented}
              onCheckedChange={(checked) => setConsented(checked as boolean)}
              className="mt-0.5"
            />
            <label
              htmlFor="consent"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I have read and agree to this authorization. I understand that Footprint Finder
              will act as my authorized agent for sending data deletion requests.
            </label>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep('intro')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleAuthorize}
              disabled={!consented || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  Authorize & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'connecting') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <CardTitle>Authorization Complete!</CardTitle>
              <CardDescription>
                Now let's connect your Gmail to start discovering services
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ You're now an authorized agent and can send deletion requests on your behalf
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">What happens next:</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-3 h-3 text-primary" />
                </div>
                <p>
                  You'll be redirected to Google to grant read-only access to your Gmail
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-primary" />
                </div>
                <p>
                  After connecting, you'll return here and can start your first scan
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConnectGmail}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Connect Gmail
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can also skip this and connect Gmail later in Settings
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
