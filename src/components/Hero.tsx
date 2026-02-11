import { useEffect, useState } from "react";
import { Shield, Zap, Target, Lock, AlertTriangle, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    navigate(`/free-scan?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background opacity-50" />
      
      {/* Animated circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 max-w-5xl text-center">
        {/* Icon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 mb-8">
          <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No login required · Takes 10 seconds</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          See What's Exposed
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About You Online
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Enter your email to get an instant exposure report. No signup, no inbox access — just results.
        </p>

        {/* Email scan form — the main CTA */}
        <form onSubmit={handleScan} className="max-w-lg mx-auto mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="flex-1 h-14 text-lg px-5 bg-background border-border"
            />
            <Button type="submit" size="lg" className="gap-2 h-14 text-lg px-8 bg-primary hover:bg-primary/90">
              <Search className="w-5 h-5" />
              Run Free Scan
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center justify-center gap-2 mt-3">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-12">
          <Lock className="w-3 h-3" />
          <span>We don't store or share your email · No inbox access</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {isLoggedIn ? (
            <Link to="/dashboard" className="text-sm text-primary hover:underline">
              Go to Dashboard →
            </Link>
          ) : (
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary">
              Already have an account? Sign in →
            </Link>
          )}
          <span className="text-muted-foreground">|</span>
          <Link to="/enterprise" className="text-sm text-muted-foreground hover:text-primary">
            Enterprise solutions →
          </Link>
        </div>

        {/* Social Proof */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">169+ Services Tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">20 Data Brokers Checked</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">GDPR / CCPA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
