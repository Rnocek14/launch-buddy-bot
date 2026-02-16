import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, AlertTriangle } from "lucide-react";

function getHashParams() {
  const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : "";
  const params = new URLSearchParams(hash);
  return {
    type: params.get("type"),
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
  };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  const hash = useMemo(() => getHashParams(), []);

  useEffect(() => {
    (async () => {
      try {
        if (hash.type !== "recovery") {
          setSessionError(true);
          return;
        }
        if (hash.access_token && hash.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: hash.access_token,
            refresh_token: hash.refresh_token,
          });
          if (error) throw error;
          setSessionReady(true);
          // Strip tokens from URL
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          setSessionError(true);
        }
      } catch (e: any) {
        setSessionError(true);
        toast({
          title: "Invalid or expired reset link",
          description: e?.message || "Please request a new password reset email.",
          variant: "destructive",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = password.length >= 6 && confirm.length >= 6 && password === confirm && !loading && sessionReady;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: "Password updated", description: "You can now log in with your new password." });
      navigate("/auth", { replace: true });
    } catch (e: any) {
      toast({
        title: "Could not update password",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent p-3">
            <Shield className="w-full h-full text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription className="mt-2">Enter a new password for your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionError ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                This link is invalid or has expired. Please request a new password reset from the login page.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full hover:bg-muted"
                onClick={() => navigate("/auth", { replace: true })}
                disabled={loading}
              >
                ← Back to login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
