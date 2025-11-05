import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Preferences() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string>("weekly");

  useEffect(() => {
    if (!token) {
      setError("Invalid preferences link");
      setFetching(false);
      return;
    }

    // Fetch current preferences
    const fetchPreferences = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("email_preferences")
          .select("email_frequency, unsubscribed")
          .eq("token", token)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setFrequency(data.email_frequency);
        }
      } catch (err: any) {
        console.error("Error fetching preferences:", err);
        setError("Failed to load preferences");
      } finally {
        setFetching(false);
      }
    };

    fetchPreferences();
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke(
        "update-email-preferences",
        {
          body: { 
            token, 
            email_frequency: frequency,
            unsubscribed: frequency === "never"
          },
        }
      );

      if (fnError) throw fnError;

      setSuccess(true);
      toast({
        title: "Preferences updated",
        description: "Your email preferences have been saved successfully.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to update preferences");
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-muted-foreground">
            This preferences link is invalid or has expired.
          </p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Preferences Updated</h1>
          <p className="text-muted-foreground">
            Your email preferences have been saved successfully.
          </p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Email Preferences</h1>
          <p className="text-muted-foreground">
            Choose how often you'd like to hear from us about Footprint Finder updates.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Email Frequency</Label>
            <RadioGroup value={frequency} onValueChange={setFrequency}>
              <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                  <div className="font-medium">Weekly Updates</div>
                  <div className="text-sm text-muted-foreground">
                    Stay informed with regular progress updates
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                  <div className="font-medium">Monthly Updates</div>
                  <div className="text-sm text-muted-foreground">
                    Get the highlights once a month
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="flex-1 cursor-pointer">
                  <div className="font-medium">No Emails</div>
                  <div className="text-sm text-muted-foreground">
                    Unsubscribe from all updates
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={loading || !token}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>

          <Link to="/" className="block">
            <Button variant="ghost" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
