import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid unsubscribe link");
    }
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke(
        "update-email-preferences",
        {
          body: { token, unsubscribed: true },
        }
      );

      if (fnError) throw fnError;

      setSuccess(true);
      toast({
        title: "Unsubscribed successfully",
        description: "You won't receive any more emails from us.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to unsubscribe");
      toast({
        title: "Error",
        description: "Failed to unsubscribe. Please try again.",
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
            This unsubscribe link is invalid or has expired.
          </p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Unsubscribed Successfully</h1>
          <p className="text-muted-foreground">
            You've been removed from our mailing list. We're sorry to see you go!
          </p>
          <p className="text-sm text-muted-foreground">
            Changed your mind?{" "}
            <Link to={`/preferences?token=${token}`} className="text-primary hover:underline">
              Update your preferences
            </Link>
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
          <h1 className="text-2xl font-bold">Unsubscribe from Emails</h1>
          <p className="text-muted-foreground">
            We're sorry to see you go! Click the button below to unsubscribe from all future emails.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleUnsubscribe}
            disabled={loading || !token}
            className="w-full"
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Unsubscribing...
              </>
            ) : (
              "Unsubscribe"
            )}
          </Button>

          <Link to={`/preferences?token=${token}`} className="block">
            <Button variant="outline" className="w-full">
              Update Preferences Instead
            </Button>
          </Link>

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
