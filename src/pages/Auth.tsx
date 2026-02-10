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

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (data.session) navigate("/dashboard", { replace: true });
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      // Only redirect if we're still on the auth page
      if (location.pathname.startsWith("/auth") && event === "SIGNED_IN") {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleOutlookSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid email profile offline_access https://graph.microsoft.com/Mail.Read',
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Outlook Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
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

      // Track successful signup
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

          <Tabs defaultValue="login" className="w-full">
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
