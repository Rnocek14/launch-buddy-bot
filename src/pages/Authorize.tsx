import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { StreamlinedOnboarding } from "@/components/StreamlinedOnboarding";
import { Loader2 } from "lucide-react";

export default function Authorize() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAlreadyAuthorized, setIsAlreadyAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if already authorized
    const { data: authorization } = await supabase
      .from("user_authorizations")
      .select("id")
      .eq("user_id", session.user.id)
      .is("revoked_at", null)
      .single();

    if (authorization) {
      setIsAlreadyAuthorized(true);
      // Redirect to dashboard after a moment
      setTimeout(() => navigate("/dashboard"), 2000);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAlreadyAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-3 max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Already Authorized</h2>
            <p className="text-muted-foreground">
              You've already completed authorization. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-12 px-4">
        <StreamlinedOnboarding onComplete={() => navigate("/dashboard")} />
      </div>
    </div>
  );
}
