import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, Loader2, Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { TRACKING_EVENTS } from "@/config/pricing";
import { trackConversion } from "@/lib/analytics";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const PUBLISHED_APP_URL = "https://footprintfinder.co";

const OAUTH_POPUP_QUERY_KEY = "oauth_popup";

const getOAuthRedirectUrl = (usePopupCallback = false) => {
  // In Lovable preview iframe flow, return to /auth so popup can notify opener
  if (usePopupCallback) {
    return `${window.location.origin}/auth?${OAUTH_POPUP_QUERY_KEY}=1`;
  }

  // On custom domain, keep redirects on production domain
  if (isOnCustomDomain()) {
    return `${PUBLISHED_APP_URL}/dashboard`;
  }

  // On Lovable preview, redirect back to the preview origin
  return `${window.location.origin}/dashboard`;
};

const isOnCustomDomain = () => {
  return !window.location.hostname.includes("lovable.app") &&
    !window.location.hostname.includes("lovableproject.com") &&
    !window.location.hostname.includes("localhost");
};

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isOAuthPopupCallback = urlParams.get(OAUTH_POPUP_QUERY_KEY) === "1";

    const completePopupFlow = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!session || !window.opener || !isOAuthPopupCallback) return;

      window.opener.postMessage(
        {
          type: "oauth-complete",
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        window.location.origin
      );

      window.close();
    };

    let isMounted = true;

    // Honor ?redirect=/path after sign-in (e.g. coming from /subscribe).
    // Only allow same-origin relative paths to prevent open-redirect abuse.
    const redirectParam = urlParams.get("redirect");
    const safeRedirect =
      redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : "/dashboard";

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted || !data.session) return;

      if (isOAuthPopupCallback) {
        await completePopupFlow(data.session);
        return;
      }

      navigate(safeRedirect, { replace: true });
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) return;

      if (isOAuthPopupCallback && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        await completePopupFlow(session);
        return;
      }

      if (location.pathname.startsWith("/auth") && event === "SIGNED_IN") {
        navigate(safeRedirect, { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isInIframe()) return;

    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "oauth-complete") return;

      const accessToken = event.data?.access_token;
      const refreshToken = event.data?.refresh_token;
      if (!accessToken || !refreshToken) return;

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        toast({
          title: "Sign-in sync failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate("/dashboard", { replace: true });
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.errors?.[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password");
        }
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startOAuthSignIn = async ({
    provider,
    title,
    allowedHosts,
    scopes,
  }: {
    provider: "google" | "azure";
    title: string;
    allowedHosts: string[];
    scopes?: string;
  }) => {
    setLoading(true);

    try {
      const insideIframe = isInIframe();
      const needsManualRedirect = isOnCustomDomain() || insideIframe;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(insideIframe),
          skipBrowserRedirect: needsManualRedirect,
          ...(scopes ? { scopes } : {}),
        },
      });

      if (error) throw error;

      if (!needsManualRedirect || !data?.url) return;

      const oauthUrl = new URL(data.url);
      if (!allowedHosts.some((host) => oauthUrl.hostname === host)) {
        throw new Error("Invalid OAuth redirect URL");
      }

      if (insideIframe) {
        const popup = window.open(data.url, "oauth-popup", "width=520,height=700");

        if (!popup) {
          throw new Error("Popup was blocked. Please allow popups and try again.");
        }

        toast({
          title: "Complete sign-in",
          description: "Finish authentication in the popup window.",
        });

        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: `${title} Failed`,
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await startOAuthSignIn({
      provider: "google",
      title: "Google Sign-In",
      allowedHosts: ["accounts.google.com", "gqxkeezkajkiyjpnjgkx.supabase.co"],
    });
  };

  const handleOutlookSignIn = async () => {
    await startOAuthSignIn({
      provider: "azure",
      title: "Outlook Sign-In",
      allowedHosts: ["login.microsoftonline.com", "gqxkeezkajkiyjpnjgkx.supabase.co"],
      scopes: "openid email profile",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.errors?.[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }

    if (!signupFullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: signupFullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("An account with this email already exists");
        }
        throw error;
      }

      if (data.user) {
        trackConversion(TRACKING_EVENTS.USER_SIGNUP, data.user.id, {
          email: signupEmail,
          fullName: signupFullName,
        });
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      
      setSignupEmail("");
      setSignupPassword("");
      setSignupFullName("");
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
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
            <CardTitle className="text-2xl">Footprint Finder</CardTitle>
            <CardDescription className="mt-2">Sign in to discover your digital footprint</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Button 
              onClick={handleGoogleSignIn} 
              variant="outline" 
              className="w-full h-12 text-base hover:bg-primary/5 hover:border-primary/30 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Chrome className="w-5 h-5 mr-2" />
                  <span>Sign in with Google</span>
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleOutlookSignIn} 
              variant="outline" 
              className="w-full h-12 text-base hover:bg-primary/5 hover:border-primary/30 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  <span>Sign in with Outlook</span>
                </>
              )}
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 py-1 text-muted-foreground font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          <Tabs defaultValue={new URLSearchParams(location.search).get("intent") === "signup" ? "signup" : "login"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-xs text-muted-foreground"
                    disabled={resetLoading || loading}
                    onClick={async () => {
                      if (!loginEmail) {
                        toast({ title: "Enter your email", description: "Type your email above, then click reset." });
                        return;
                      }
                      try {
                        setResetLoading(true);
                        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                          redirectTo: `${PUBLISHED_APP_URL}/reset-password`,
                        });
                        if (error) throw error;
                        toast({ title: "Password reset sent", description: "Check your inbox for a password reset link." });
                      } catch (err: any) {
                        toast({ title: "Could not send reset email", description: err?.message || "Please try again.", variant: "destructive" });
                      } finally {
                        setResetLoading(false);
                      }
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-border">
            <Link to="/" className="block">
              <Button variant="ghost" className="w-full hover:bg-muted">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
